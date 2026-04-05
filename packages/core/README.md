# @qrkit/core

Framework-agnostic protocol core for QR-based airgapped wallet flows. Designed for use in browser-based dApps.

Handles the ERC-4527 / UR / CBOR stack: decoding scanned QR exports, deriving EVM addresses, building sign requests, and parsing signature responses. No DOM, no React, no external services.

## Install

```sh
pnpm add @qrkit/core
```

## Usage

### 1. Parse the connection QR from the wallet

Scan the `crypto-hdkey` or `crypto-account` QR exported by the hardware wallet, then derive the EVM account:

```ts
import { parseConnection } from '@qrkit/core'

// scannedUR comes from a QR scanner — { type: string, cbor: Uint8Array }
const [account] = parseConnection(scannedUR, { chains: ['evm'] })

account.address          // EIP-55 checksummed address
account.publicKey        // compressed pubkey hex
account.sourceFingerprint // master key fingerprint — required for signing
```

### 2. Build a sign request

Encode a message as animated UR parts to display as a QR code for the wallet to scan:

```ts
import { buildEthSignRequestURParts, buildEthSignRequestUR } from '@qrkit/core'

// Animated QR (multiple parts for long messages)
const parts = buildEthSignRequestURParts(message, account.address, account.sourceFingerprint)
// parts is string[] — cycle through them to animate the QR

// Single-frame QR (short messages)
const ur = buildEthSignRequestUR(message, account.address, account.sourceFingerprint)
```

### 3. Parse the wallet's signature response

After the user scans the wallet's response QR, decode the signature:

```ts
import { parseEthSignature } from '@qrkit/core'

const signature = parseEthSignature(scannedResponseUR)
// → '0x...' hex string, ready for ethers / viem
```

## API

| Export | Description |
|---|---|
| `parseConnection(ur, options)` | Parse a `crypto-hdkey` or `crypto-account` UR into `Account[]` |
| `buildEthSignRequestURParts(message, address, fingerprint)` | Build animated UR parts for an EIP-191 sign request |
| `buildEthSignRequestUR(message, address, fingerprint)` | Build a single-frame UR for a sign request |
| `parseEthSignature(ur)` | Decode an `eth-signature` UR into a `0x...` hex string |

## License

[Apache 2.0](../../LICENSE)
