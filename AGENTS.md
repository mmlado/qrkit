# qrkit — Agent Guide

## Project Overview

qrkit is a TypeScript monorepo providing a generic QR connector library for airgapped wallet flows. It is a **frontend library** — all packages are designed to run in the browser. It implements the ERC-4527 / UR / CBOR protocol stack used by Shell, Keystone, and similar hardware wallets — allowing web dApps to connect and sign transactions without any online wallet bridge.

## Package Layout

```
packages/
  core/     @qrkit/core    — framework-agnostic protocol logic
  react/    @qrkit/react   — React provider, hooks, drop-in components
  wagmi/    @qrkit/wagmi   — wagmi connector adapter for EVM dApps
```

Dependencies flow in one direction only:

```
@qrkit/core  ←  @qrkit/react  ←  @qrkit/wagmi
```

`@qrkit/core` has no framework dependencies. `@qrkit/react` and `@qrkit/wagmi` declare React as a peer dependency. `wagmi` and `viem` are peer dependencies of `@qrkit/wagmi` only.

## Tooling

- **Package manager**: pnpm with workspaces (`pnpm-workspace.yaml`)
- **Build orchestration**: Turborepo (`turbo.json`) — respects inter-package build order automatically
- **Per-package build**: tsup (wraps esbuild) — outputs ESM, CJS, and `.d.ts`
- **Testing**: Vitest
- **Versioning / changelogs**: Changesets

### Common commands

```sh
pnpm install          # install all workspace deps
pnpm build            # build all packages in dependency order
pnpm test             # run all tests
pnpm typecheck        # typecheck all packages
pnpm changeset        # open changeset wizard for a new release entry
pnpm version-packages # apply pending changesets and bump versions
pnpm release          # build + publish all public packages
```

### Working on a single package

```sh
pnpm --filter @qrkit/core build
pnpm --filter @qrkit/core test
pnpm --filter @qrkit/react dev    # watch mode
```

## Source Structure

Each package follows the same layout:

```
packages/<name>/
  src/
    index.ts          # public API — only export from here
  dist/               # generated, do not edit
  package.json
  tsconfig.json
  tsup.config.ts
  README.md
  CHANGELOG.md
```

All public exports must go through `src/index.ts`. Do not import across packages using relative paths — use the package name (`@qrkit/core`), which resolves via `workspace:*`.

## Code Style

### Import ordering

Group and order imports in every file:

1. Node built-ins (if any)
2. External packages
3. Internal packages (`@qrkit/*`)
4. Relative imports — deepest first, then siblings, then parent

Leave a blank line between each group.

```ts
// external
import { decode } from "cborg";
import { URDecoder } from "@ngraveio/bc-ur";

// internal package
import type { ScannedUR } from "@qrkit/core";

// relative
import { deriveEvmAccount } from "../eth/deriveAccount.js";
import type { QRKitConfig } from "./types.js";
```

## TypeScript Config

The root `tsconfig.base.json` defines shared compiler options. Each package extends it and adds its own `outDir`, `rootDir`, and (for React packages) `jsx`. Key settings:

- `strict: true`
- `verbatimModuleSyntax: true` — use `import type` for type-only imports
- `erasableSyntaxOnly: true` — no enums, no experimental decorators
- `noUnusedLocals` and `noUnusedParameters: true`

## Protocol Background

The core package implements:

- **UR (Uniform Resources)** — self-describing, CBOR-encoded format for QR data, optionally split across animated frames. Uses `@ngraveio/bc-ur`.
- **CBOR** — binary encoding used inside UR payloads. Uses `cborg`.
- **crypto-hdkey / crypto-account** — UR types for exporting xpubs from a hardware wallet.
- **eth-sign-request / eth-signature** — UR types for EVM signing flows (ERC-4527).
- **HD key derivation** — derive EVM addresses from exported xpubs. Uses `@scure/bip32`.

The prototype implementation at `../shell_dapp_prototype/src/lib/` is the reference for all protocol logic. When in doubt about encoding details, check those files first.

## Key Invariants

- `@qrkit/core` must never import from `react`, `react-dom`, DOM APIs, or any camera/canvas library.
- `@qrkit/react` must never import from `wagmi` or `viem`.
- Session state is the responsibility of `@qrkit/core`. React and wagmi layers wrap it, they do not reimplement it.
- All QR parts (animated or single-frame) are represented as `string[]` in the core layer. Rendering is the responsibility of the React layer.
- Bitcoin support is not in scope yet. When it is added, all BTC-specific logic (sign requests, signature parsing, address derivation, message verification) must live in dedicated files (e.g. `btcSignRequest.ts`, `btcSignature.ts`) and must not bleed into EVM files, tests, or types. BTC and EVM code paths must remain clearly separated at all times.
- `QRKitProvider` renders no wrapper DOM elements — modals portal into `document.body`, theme variables inject a `<style>` tag into `<head>`.
- Scanning and rendering are split into two layers: batteries-included (`useQRScanner`, `useQRDisplay`) and primitive (`useURDecoder`, `useQRParts`). The primitives accept/emit raw strings and are scanner/renderer agnostic.
- UI dependencies: `qr-scanner` for camera scanning, `qrcode` for canvas rendering, `focus-trap` for modal accessibility. Do not pull in full UI frameworks.
- Default styles follow Material Design 3 tokens and support automatic light/dark via `prefers-color-scheme`. Theme overrides use CSS custom properties via a `<style>` tag injected by `QRKitProvider`.

## Changelogs

Each package has its own `CHANGELOG.md` following [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format. Do not edit changelogs manually — use `pnpm changeset` to add entries, then `pnpm version-packages` to apply them.

## Adding a New Package

1. Create `packages/<name>/` with `src/index.ts`, `package.json`, `tsconfig.json`, `tsup.config.ts`, `README.md`, `CHANGELOG.md`.
2. Extend `tsconfig.base.json` in the package tsconfig.
3. The package will be picked up automatically by `pnpm-workspace.yaml` and Turborepo.

## Testing Approach

- Unit tests live alongside source in `src/` or in a `src/__tests__/` subdirectory.
- Tests use Vitest. No test framework globals — import from `vitest` explicitly.
- `@qrkit/core` tests should cover all protocol encode/decode paths with known-good UR fixtures.
- Do not mock the UR codec or CBOR parser in core tests — use real encoded payloads.
- `@qrkit/react` tests use `@testing-library/react` with jsdom. A `vitest.config.ts` per package sets `environment: "jsdom"` and `globals: true` (required by `@testing-library/jest-dom`).
- jsdom does not expose `crypto.getRandomValues`. Polyfill it in `src/__tests__/setup.ts` using Node's `webcrypto`.
- Do not test `SignModal` rendering directly in unit tests — it calls `buildEthSignRequestURParts` which uses `CborTag` instanceof checks that fail across module boundaries in Vitest workspace resolution. Test the context state shape instead; sign request encoding is covered by `@qrkit/core` tests.

## Finishing a Task

When the user says **"finish"**, do the following in order:

1. **Add missing tests** — cover any new or changed behaviour not yet tested.
2. **Lint** — run `pnpm lint` and fix all errors.
3. **Format** — run `pnpm format` and apply changes.
4. **Run all tests** — run `pnpm test` and confirm everything passes.
5. **Add a changeset** — run `pnpm changeset` and follow the prompts: select the affected packages, choose a bump type (`patch` / `minor` / `major`), and write a short summary. Do not edit `CHANGELOG.md` manually — it is generated by `pnpm version-packages`.
6. **Update AGENTS.md** — if anything was added, changed, or decided that is non-obvious and useful for future sessions (new invariants, new conventions, architectural decisions), add it here.

## References

- ERC-4527 spec: https://eips.ethereum.org/EIPS/eip-4527
- UR spec (bc-ur): https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2020-005-ur.md
- Keystone QR protocol write-up: https://github.com/KeystoneHQ/Keystone-developer-hub/blob/main/research/ethereum-qr-data-protocol.md
- wagmi connector API: https://wagmi.sh/dev/creating-connectors
