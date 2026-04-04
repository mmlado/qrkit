# @qrkit/core

Framework-agnostic protocol core for QR-based airgapped wallet flows.

Handles the full ERC-4527 / UR / CBOR stack: decoding scanned QR exports, deriving addresses, building sign requests, and parsing signature responses. No DOM, no React, no external services.

## Install

```sh
pnpm add @qrkit/core
```

## Planned API

```ts
import { createClient, parseSignatureResponse } from '@qrkit/core'

const client = createClient({
  appName: 'My dApp',
  chains: ['evm'],
})

// Parse a scanned connection QR (crypto-hdkey or crypto-account)
const session = await client.createSession(scannedUR)

// Build a sign request — returns QR parts to display
const request = await client.signMessage(session, {
  accountId: session.accounts[0].id,
  message: 'hello from qrkit',
})

// After scanning the wallet's signature response
const result = await parseSignatureResponse(session, request, scannedResponseUR)
console.log(result.signature)
```

## License

[Apache 2.0](../../LICENSE)
