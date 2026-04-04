# @qrkit/react

React context, hooks, and drop-in components for QR-based airgapped wallet flows.

Builds on [`@qrkit/core`](../core). Provides a provider/context model, ready-to-use hooks, and optional drop-in components for connection scanning, account display, and message signing.

## Install

```sh
pnpm add @qrkit/react
```

React 18+ is required as a peer dependency.

## Planned API

### Provider

```tsx
import { QRKitProvider } from '@qrkit/react'

<QRKitProvider config={{ appName: 'My dApp', chains: ['evm'] }}>
  <App />
</QRKitProvider>
```

### Hooks

```ts
import { useQRKit, useQRKitConnect, useQRKitSignMessage } from '@qrkit/react'

const { status, session, accounts, disconnect } = useQRKit()
const { startConnectionScan } = useQRKitConnect()
const { request, createMessageRequest, parseSignatureResponse } = useQRKitSignMessage()
```

### Drop-in components

```tsx
import { QRKitConnect, QRKitAccounts, QRKitSignMessage } from '@qrkit/react'

// Scan a connection QR
<QRKitConnect onConnected={(session) => console.log(session)} />

// Display derived accounts
<QRKitAccounts />

// Full sign message flow
<QRKitSignMessage message="hello" onSigned={(result) => console.log(result.signature)} />
```

## License

[Apache 2.0](../../LICENSE)
