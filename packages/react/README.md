# @qrkit/react

React context, hooks, and drop-in components for QR-based airgapped wallet flows.

Builds on [`@qrkit/core`](../core). Provides a provider/context, ready-to-use modals, and composable hooks for connection scanning, multi-account selection, EVM signing, BTC message signing, and BTC PSBT transport.

## Install

```sh
pnpm add @qrkit/react
```

Import the default styles (or bring your own):

```ts
import "@qrkit/react/styles.css";
```

React 18+ is required as a peer dependency.

## Quick start — drop-in components

Wrap your app in `QRKitProvider` and call `connect()` / `sign()` from anywhere. The modals appear automatically.

```tsx
import { QRKitProvider, useQRKit } from "@qrkit/react";
import "@qrkit/react/styles.css";

export function App() {
  return (
    <QRKitProvider appName="My dApp">
      <Wallet />
    </QRKitProvider>
  );
}

function Wallet() {
  const { account, connect, disconnect, sign } = useQRKit();

  async function handleSign() {
    if (!account) return;

    if (account.chain === "evm") {
      const sig = await sign({
        signData: "Hello from My dApp",
        address: account.address,
        sourceFingerprint: account.sourceFingerprint,
      });
      console.log("EVM signature:", sig);
      return;
    }

    const sig = await sign({
      chain: "btc",
      requestType: "message",
      signData: "Hello from My dApp",
      address: account.address,
      scriptType: account.scriptType,
      sourceFingerprint: account.sourceFingerprint,
    });
    console.log("BTC signature:", sig);
  }

  if (!account) return <button onClick={connect}>Connect wallet</button>;

  return (
    <div>
      <p>{account.address}</p>
      <button onClick={handleSign}>Sign message</button>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  );
}
```

If a scanned wallet exports multiple accounts, the built-in connect modal presents an account picker instead of silently selecting the first result.

## Theming

Pass a `theme` prop to override CSS variables. Defaults follow Material Design 3 and automatically adapt to light/dark system preference.

```tsx
<QRKitProvider theme={{ accent: "#ff6b00", radius: "8px" }}>...</QRKitProvider>
```

Or override in CSS directly:

```css
.qrkit {
  --qrkit-accent: #ff6b00;
  --qrkit-radius: 8px;
}
```

| Variable             | Default (light) | Default (dark) |
| -------------------- | --------------- | -------------- |
| `--qrkit-accent`     | `#6750A4`       | `#D0BCFF`      |
| `--qrkit-bg`         | `#FFFBFE`       | `#1C1B1F`      |
| `--qrkit-text`       | `#1C1B1F`       | `#E6E1E5`      |
| `--qrkit-text-muted` | `#49454F`       | `#CAC4D0`      |
| `--qrkit-radius`     | `12px`          | `12px`         |

## Low-level hooks

### Batteries-included

Use `useQRScanner` and `useQRDisplay` when you want custom layouts but keep the built-in camera and QR rendering libraries.

```tsx
import { useQRScanner, useQRDisplay } from "@qrkit/react";

const { videoRef, progress, error } = useQRScanner({ onScan, enabled });
const { canvasRef, frame, total } = useQRDisplay({ parts });
```

### Bring your own scanner / renderer

Use `useURDecoder` and `useQRParts` to plug in any scanning or rendering library.

```tsx
import { useURDecoder, useQRParts } from "@qrkit/react";

// Feed raw QR strings from any source
const { receivePart, progress } = useURDecoder({ onScan });

// Get the current part string to render with any library
const { part, frame, total } = useQRParts({ parts });
```

## API

### `QRKitProvider`

| Prop      | Type                    | Default          |
| --------- | ----------------------- | ---------------- |
| `appName` | `string`                | `"qrkit"`        |
| `theme`   | `QRKitTheme`            | MD3 defaults     |
| `chains`  | `Array<"evm" \| "btc">` | `["evm", "btc"]` |

### `useQRKit`

```ts
const { account, connect, disconnect, sign } = useQRKit();
```

|              | Type                                            |
| ------------ | ----------------------------------------------- |
| `account`    | `Account \| null`                               |
| `connect`    | `() => void`                                    |
| `disconnect` | `() => void`                                    |
| `sign`       | `(request: SignRequest) => Promise<SignResult>` |

### `SignRequest`

```ts
type SignRequest = EvmSignRequest | BtcMessageSignRequest | BtcPsbtSignRequest;

interface EvmSignRequest {
  chain?: "evm";
  signData: Uint8Array | string;
  dataType?: number;
  address: string;
  sourceFingerprint: number | undefined;
  chainId?: number;
}

interface BtcMessageSignRequest {
  chain: "btc";
  requestType: "message";
  signData: Uint8Array | string;
  address: string;
  scriptType: "p2wpkh" | "p2sh-p2wpkh" | "p2pkh";
  sourceFingerprint: number | undefined;
}

interface BtcPsbtSignRequest {
  chain: "btc";
  requestType: "psbt";
  psbt: Uint8Array | string;
}

type SignResult =
  | string // EVM hex signature
  | BtcSignature // BTC message signature
  | CryptoPsbt; // signed PSBT bytes and hex
```

Note: BIP-322-style message signing also uses `requestType: "psbt"`. The QR transport is the same as transaction signing, and wallet review screens may label it differently depending on the device.

## License

[Apache 2.0](../../LICENSE)
