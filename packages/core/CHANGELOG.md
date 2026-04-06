# Changelog

## 0.3.0

### Minor Changes

- Refactor `buildEthSignRequestURParts` and `buildEthSignRequestUR` to accept a params object (`EthSignRequestParams`) instead of positional arguments. Adds `EthDataType` constants, `dataType` field (defaults to `PersonalMessage`), `chainId` support, and `signData` accepting raw `Uint8Array` in addition to strings. The `SignRequest` interface in `@qrkit/react` is updated accordingly.

## 0.2.0

### Minor Changes

- e720f1e: Replace `@ngraveio/bc-ur` with `@qrkit/bc-ur` — a pure-JS, buffer-free UR implementation. Removes the `buffer` peer dependency from `@qrkit/core`; no polyfill setup required in consumer projects.

## 0.1.0

### Minor Changes

- Initial EVM implementation: `parseConnection`, `buildEthSignRequestURParts`, `parseEthSignature`. `QRKitConfig` with optional `chains` filter — omitting it tries all supported chains.
