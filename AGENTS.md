# qrkit — Agent Guide

## Project Overview

qrkit is a TypeScript monorepo providing a generic QR connector library for airgapped wallet flows. It implements the ERC-4527 / UR / CBOR protocol stack used by Shell, Keystone, and similar hardware wallets — allowing web dApps to connect and sign transactions without any online wallet bridge.

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
- **btc-sign-request / btc-signature** — UR types for Bitcoin signing flows.
- **HD key derivation** — derive EVM and Bitcoin addresses from exported xpubs. Uses `@scure/bip32`.

The prototype implementation at `../shell_dapp_prototype/src/lib/` is the reference for all protocol logic. When in doubt about encoding details, check those files first.

## Key Invariants

- `@qrkit/core` must never import from `react`, `react-dom`, DOM APIs, or any camera/canvas library.
- `@qrkit/react` must never import from `wagmi` or `viem`.
- Session state is the responsibility of `@qrkit/core`. React and wagmi layers wrap it, they do not reimplement it.
- All QR parts (animated or single-frame) are represented as `string[]` in the core layer. Rendering is the responsibility of the React layer.
- Signature verification for Bitcoin messages is done in `@qrkit/core`, not in the React layer.

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

## References

- ERC-4527 spec: https://eips.ethereum.org/EIPS/eip-4527
- UR spec (bc-ur): https://github.com/BlockchainCommons/Research/blob/master/papers/bcr-2020-005-ur.md
- Keystone QR protocol write-up: https://github.com/KeystoneHQ/Keystone-developer-hub/blob/main/research/ethereum-qr-data-protocol.md
- wagmi connector API: https://wagmi.sh/dev/creating-connectors
