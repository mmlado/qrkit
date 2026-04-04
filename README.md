# qrkit

Generic QR connector for airgapped wallet flows.

A reusable library for QR-based, airgapped wallet connection and signing flows. Built around [ERC-4527](https://eips.ethereum.org/EIPS/eip-4527) / UR / CBOR — the same protocol used by Keystone and Shell hardware wallets.

## Packages

| Package | Description |
|---|---|
| [`@qrkit/core`](./packages/core) | Protocol logic: UR decoding, xpub parsing, address derivation, sign request and signature handling |
| [`@qrkit/react`](./packages/react) | React context, hooks, and drop-in components for connection and signing flows |
| [`@qrkit/wagmi`](./packages/wagmi) | wagmi connector adapter for EVM dApps |

## Architecture

```
@qrkit/core       — framework-agnostic, no DOM/React dependencies
@qrkit/react      — builds on core, adds camera scanning and QR rendering
@qrkit/wagmi      — builds on react, exposes a wagmi-compatible connector
```

The core package can be used in any environment. The React and wagmi packages are layered on top and are optional.

## Quick Start

### React

```tsx
import { QRKitProvider } from '@qrkit/react'

<QRKitProvider config={{ appName: 'My dApp', chains: ['evm'] }}>
  <App />
</QRKitProvider>
```

### wagmi

```tsx
import { qrkitConnector } from '@qrkit/wagmi'

const config = createConfig({
  connectors: [qrkitConnector({ appName: 'My dApp' })],
  ...
})
```

### Core only

```ts
import { createClient, parseSignatureResponse } from '@qrkit/core'

const client = createClient({ appName: 'My dApp', chains: ['evm'] })
const session = await client.createSession(scannedUR)
const request = await client.signMessage(session, { accountId, message })
// render request.qrParts as QR codes
const result = await parseSignatureResponse(session, request, scannedResponseUR)
```

## Development

### Prerequisites

- [pnpm](https://pnpm.io/) 9+
- Node.js 20+

### Setup

```sh
pnpm install
```

### Build

```sh
pnpm build
```

### Test

```sh
pnpm test
```

### Add a changeset

```sh
pnpm changeset
```

## License

[Apache 2.0](./LICENSE)
