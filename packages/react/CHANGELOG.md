# Changelog

## 0.7.0

### Minor Changes

- a46a05b: Add an optional `derivationPath` to `BtcMessageSignRequest` and pass it to the btc-sign-request built by `SignModal`. The README now uses `deriveAddress(index)` in place of the removed `account.address`.

### Patch Changes

- Updated dependencies [a46a05b]
  - @qrkit/core@0.8.0

## 0.6.0

### Minor Changes

- b97b47f: Add an optional `derivationPath` to `EvmSignRequest` and pass it to the eth-sign-request built by `SignModal`. The signing examples pass the derived address's path.

### Patch Changes

- 5eefc48: Stop the camera stream when `useQRScanner` is disabled or unmounted before the camera starts. Before, a stream that arrived after cleanup stayed on.
- Updated dependencies [b97b47f]
  - @qrkit/core@0.7.0

## 0.5.0

### Major Changes

- 040ed8b: BREAKING: Update connection UI, hooks examples, and signing examples to use the new account-level `deriveAddress(index)` API.

### Patch Changes

- Updated dependencies [040ed8b]
  - @qrkit/core@0.6.0

## 0.4.2

### Patch Changes

- Updated dependencies
  - @qrkit/core@0.5.0

## 0.4.1

### Patch Changes

- Updated dependencies
  - @qrkit/core@0.4.1

## 0.4.0

### Minor Changes

- Add BTC account selection to the connect flow.
- Add BTC message and PSBT signing support to the sign flow.
- Improve animated UR scanning behavior for repeated QR frames.

### Patch Changes

- Updated dependencies
  - @qrkit/core@0.4.0

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
