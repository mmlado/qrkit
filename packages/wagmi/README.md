# @qrkit/wagmi

wagmi connector adapter for QR-based airgapped wallet flows.

Builds on [`@qrkit/core`](../core) and [`@qrkit/react`](../react). Exposes Shell as a first-class wallet choice in a wagmi wallet list. The connector opens a QR modal for `connect`, `signMessage`, and eventually `sendTransaction` — no injected provider required.

## Install

```sh
pnpm add @qrkit/wagmi
```

wagmi 2+, viem 2+, and React 18+ are required as peer dependencies.

## Planned API

```ts
import { createConfig } from 'wagmi'
import { qrkitConnector } from '@qrkit/wagmi'

const config = createConfig({
  connectors: [
    qrkitConnector({ appName: 'My dApp' }),
  ],
  ...
})
```

```tsx
// Add the modal host somewhere in your tree
import { QRKitModalHost } from '@qrkit/react'

function App() {
  return (
    <>
      <YourApp />
      <QRKitModalHost />
    </>
  )
}
```

The connector will pause `connect` and `signMessage` until the user completes the QR exchange in the modal, then resolve the wagmi call normally.

## License

[Apache 2.0](../../LICENSE)
