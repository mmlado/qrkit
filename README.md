# qrkit

[![CI](https://github.com/mmlado/qrkit/actions/workflows/ci.yml/badge.svg)](https://github.com/mmlado/qrkit/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9-f69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![npm @qrkit/core](https://img.shields.io/npm/v/@qrkit/core?label=%40qrkit%2Fcore)](https://www.npmjs.com/package/@qrkit/core)
[![npm @qrkit/react](https://img.shields.io/npm/v/@qrkit/react?label=%40qrkit%2Freact)](https://www.npmjs.com/package/@qrkit/react)
[![npm @qrkit/wagmi](https://img.shields.io/npm/v/@qrkit/wagmi?label=%40qrkit%2Fwagmi)](https://www.npmjs.com/package/@qrkit/wagmi)

Generic QR connector for airgapped wallet flows. **[Live demo →](https://qrkit-react-ouhcro35m-mladen-milankovics-projects.vercel.app/)**

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

### React — drop-in components

Wrap your app in `QRKitProvider`. Call `connect()` and `sign()` from anywhere — modals appear automatically.

```tsx
import { QRKitProvider, useQRKit } from '@qrkit/react'
import '@qrkit/react/styles.css'

export function App() {
  return (
    <QRKitProvider appName="My dApp">
      <Wallet />
    </QRKitProvider>
  )
}

function Wallet() {
  const { account, connect, disconnect, sign } = useQRKit()

  async function handleSign() {
    if (!account) return
    const sig = await sign({
      message: 'Hello from My dApp',
      address: account.address,
      sourceFingerprint: account.chain === 'evm' ? account.sourceFingerprint : undefined,
    })
    console.log('Signature:', sig)
  }

  if (!account) return <button onClick={connect}>Connect wallet</button>

  return (
    <div>
      <p>{account.address}</p>
      <button onClick={handleSign}>Sign message</button>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  )
}
```

Styles follow Material Design 3 and adapt to light/dark system preference automatically. Override with CSS variables:

```css
.qrkit {
  --qrkit-accent: #ff6b00;
  --qrkit-radius: 8px;
}
```

Or via the `theme` prop:

```tsx
<QRKitProvider appName="My dApp" theme={{ accent: '#ff6b00' }}>
```

### React — low-level hooks

For custom layouts, use `useQRScanner` and `useQRDisplay` directly. To plug in your own scanning or rendering library, use `useURDecoder` and `useQRParts`:

```tsx
import { useURDecoder, useQRParts } from '@qrkit/react'

// Feed raw QR strings from any scanner
const { receivePart, progress } = useURDecoder({ onScan })

// Get the current frame string for any renderer
const { part, frame, total } = useQRParts({ parts })
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
import {
  parseConnection,
  buildEthSignRequestURParts,
  parseEthSignature,
} from '@qrkit/core'

// Parse a connection QR from the wallet
const accounts = parseConnection(scannedUR, { chains: ['evm'] })
const account = accounts.find(a => a.chain === 'evm')

// Build a sign request — render parts as QR codes
const parts = buildEthSignRequestURParts(message, account.address, account.sourceFingerprint)

// Parse the wallet's signature response
const signature = parseEthSignature(scannedResponseUR)
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
