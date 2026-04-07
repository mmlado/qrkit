# Changelog

## 0.3.2

### Patch Changes

- Updated dependencies
  - @qrkit/core@0.3.2

## 0.3.1

### Patch Changes

- Updated dependencies
  - @qrkit/core@0.3.1

## 0.3.0

### Minor Changes

- Update `SignRequest` interface: rename `message` to `signData` (`Uint8Array | string`), add optional `dataType` and `chainId` fields to support all ERC-4527 data types.

### Patch Changes

- Updated dependencies
  - @qrkit/core@0.3.0

## 0.2.0

### Minor Changes

- e720f1e: Replace `@ngraveio/bc-ur` with `@qrkit/bc-ur` — a pure-JS, buffer-free UR implementation. Removes the `buffer` peer dependency from `@qrkit/core`; no polyfill setup required in consumer projects.

### Patch Changes

- bd11a69: Replace `qr-scanner` (WASM) with `jsQR` (pure JS) for broader compatibility. Works in browser extensions, service workers, and any environment where WebAssembly workers are restricted.
- Updated dependencies [e720f1e]
  - @qrkit/core@0.2.0

## 0.1.0

### Minor Changes

- Initial implementation: `QRKitProvider`, `useQRKit`, `ConnectModal`, `SignModal`, `QRScanner`, `QRDisplay`. Low-level hooks `useQRScanner`, `useQRDisplay`, `useURDecoder`, `useQRParts` for custom scanner/renderer integrations. Material Design 3 theming with light/dark support via CSS variables.

## 0.0.1

### Patch Changes

- Updated dependencies
  - @qrkit/core@0.1.0
