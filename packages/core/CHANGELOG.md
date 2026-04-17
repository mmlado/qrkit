# Changelog

## 0.5.0

### Minor Changes

- Add derivationPath to EvmAccount and BtcAccount
- Add addressIndex to QRKitConfig

## 0.4.1

### Patch Changes

- Replace `@noble/secp256k1` with `@noble/curves` for secp256k1 point decompression.

## 0.4.0

### Minor Changes

- Parse BTC accounts from `crypto-account` and `crypto-multi-accounts`.
- Derive BTC addresses and account metadata for supported script types.
- Build and parse BTC message signing URs and `crypto-psbt` payloads.

## 0.3.2

### Patch Changes

- Replace @qrkit/bc-ur dependency with @qrkit/bc-ur-web, the renamed browser-native fork that drops the Buffer and React Native polyfill dependencies.

## 0.3.1

### Patch Changes

- Expose device name from crypto-hdkey key 9 as `device` on `Account`. Wallets that set this field (e.g. Keycard Shell) will now surface the device name through `parseConnection` and `parseXpub`.

## 0.3.0

### Minor Changes

- Refactor `buildEthSignRequestURParts` and `buildEthSignRequestUR` to accept a params object (`EthSignRequestParams`) instead of positional arguments. Adds `EthDataType` constants, `dataType` field (defaults to `PersonalMessage`), `chainId` support, and `signData` accepting raw `Uint8Array` in addition to strings. The `SignRequest` interface in `@qrkit/react` is updated accordingly.

## 0.2.0

### Minor Changes

- e720f1e: Replace `@ngraveio/bc-ur` with `@qrkit/bc-ur` — a pure-JS, buffer-free UR implementation. Removes the `buffer` peer dependency from `@qrkit/core`; no polyfill setup required in consumer projects.

## 0.1.0

### Minor Changes

- Initial EVM implementation: `parseConnection`, `buildEthSignRequestURParts`, `parseEthSignature`. `QRKitConfig` with optional `chains` filter — omitting it tries all supported chains.
