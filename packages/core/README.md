# @qrkit/core

Framework-agnostic protocol core for QR-based airgapped wallet flows. Designed for use in browser-based dApps.

Handles the ERC-4527 / UR / CBOR stack: decoding scanned QR exports, deriving EVM addresses, building sign requests, and parsing signature responses. No DOM, no React, no external services.

## Install

```sh
pnpm add @qrkit/core
```

## Usage

```ts
import { parseXpub, deriveEvmAccount, buildEthSignRequestURParts, parseEthSignature } from '@qrkit/core'

// 1. Parse the connection QR exported from the wallet (crypto-hdkey or crypto-account)
const parsed = parseXpub(scannedUR)
const account = deriveEvmAccount(parsed)
// account.address  → EIP-55 checksummed address
// account.publicKey → compressed pubkey hex
// account.sourceFingerprint → required by Shell for signing

// 2. Build a sign request — returns UR parts to display as QR codes
const parts = buildEthSignRequestURParts(message, account.address, account.sourceFingerprint)
// parts.length === 1 for short messages, >1 for animated QR

// 3. After the user scans the wallet's response QR
const signature = parseEthSignature(scannedResponseUR)
// → '0x...' hex string
```

## Browser usage

This package is designed to run in the browser. It depends on [`@ngraveio/bc-ur`](https://github.com/ngraveio/bc-ur) which internally uses the Node.js `Buffer` API.

Modern bundlers (Vite, webpack, etc.) polyfill `Buffer` automatically. If you see a `Buffer is not defined` error, add the [`buffer`](https://www.npmjs.com/package/buffer) package and configure your bundler to inject it:

**Vite:**

```ts
// vite.config.ts
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [nodePolyfills({ include: ['buffer'] })],
})
```

**Or manually in your entry file:**

```ts
import { Buffer } from 'buffer'
globalThis.Buffer = Buffer
```

## License

[Apache 2.0](../../LICENSE)
