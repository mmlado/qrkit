# @qrkit/react

React context, hooks, and drop-in components for QR-based airgapped wallet flows.

Builds on [`@qrkit/core`](../core). Provides a provider/context, ready-to-use modals, and composable hooks for connection scanning and transaction signing.

## Install

```sh
pnpm add @qrkit/react
```

Import the default styles (or bring your own):

```ts
import '@qrkit/react/styles.css'
```

React 18+ is required as a peer dependency.

## Quick start — drop-in components

Wrap your app in `QRKitProvider` and call `connect()` / `sign()` from anywhere. The modals appear automatically.

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

## Theming

Pass a `theme` prop to override CSS variables. Defaults follow Material Design 3 and automatically adapt to light/dark system preference.

```tsx
<QRKitProvider theme={{ accent: '#ff6b00', radius: '8px' }}>
  ...
</QRKitProvider>
```

Or override in CSS directly:

```css
.qrkit {
  --qrkit-accent: #ff6b00;
  --qrkit-radius: 8px;
}
```

| Variable | Default (light) | Default (dark) |
|---|---|---|
| `--qrkit-accent` | `#6750A4` | `#D0BCFF` |
| `--qrkit-bg` | `#FFFBFE` | `#1C1B1F` |
| `--qrkit-text` | `#1C1B1F` | `#E6E1E5` |
| `--qrkit-text-muted` | `#49454F` | `#CAC4D0` |
| `--qrkit-radius` | `12px` | `12px` |

## Low-level hooks

### Batteries-included

Use `useQRScanner` and `useQRDisplay` when you want custom layouts but keep the built-in camera and QR rendering libraries.

```tsx
import { useQRScanner, useQRDisplay } from '@qrkit/react'

const { videoRef, progress, error } = useQRScanner({ onScan, enabled })
const { canvasRef, frame, total } = useQRDisplay({ parts })
```

### Bring your own scanner / renderer

Use `useURDecoder` and `useQRParts` to plug in any scanning or rendering library.

```tsx
import { useURDecoder, useQRParts } from '@qrkit/react'

// Feed raw QR strings from any source
const { receivePart, progress } = useURDecoder({ onScan })

// Get the current part string to render with any library
const { part, frame, total } = useQRParts({ parts })
```

## API

### `QRKitProvider`

| Prop | Type | Default |
|---|---|---|
| `appName` | `string` | `"qrkit"` |
| `theme` | `QRKitTheme` | MD3 defaults |

### `useQRKit`

```ts
const { account, connect, disconnect, sign } = useQRKit()
```

| | Type |
|---|---|
| `account` | `Account \| null` |
| `connect` | `() => void` |
| `disconnect` | `() => void` |
| `sign` | `(request: SignRequest) => Promise<string>` |

### `SignRequest`

```ts
interface SignRequest {
  message: string
  address: string
  sourceFingerprint: number | undefined
}
```

## License

[Apache 2.0](../../LICENSE)
