/**
 * Example: drop-in components
 *
 * The simplest integration. Wrap your app in QRKitProvider and call
 * connect() / sign() from anywhere — the modals appear automatically.
 */

import { QRKitProvider, useQRKit } from "@qrkit/react";
import "@qrkit/react/styles.css";

// ── App shell ────────────────────────────────────────────────────────────────

export function App() {
  return (
    <QRKitProvider appName="My dApp" theme={{ accent: "#6750a4" }}>
      <Wallet />
    </QRKitProvider>
  );
}

// ── Wallet UI ─────────────────────────────────────────────────────────────────

function Wallet() {
  const { account, connect, disconnect, sign } = useQRKit();
  const derived = account?.deriveAddress(0);

  async function handleSign() {
    if (!account || account.chain !== "evm" || !derived) return;
    try {
      const sig = await sign({
        signData: "Hello from My dApp",
        address: derived.address,
        sourceFingerprint: account.sourceFingerprint,
      });
      console.log("Signature:", sig);
    } catch {
      console.log("User rejected");
    }
  }

  if (!account) {
    return <button onClick={connect}>Connect wallet</button>;
  }

  return (
    <div>
      <p>Connected: {derived.address}</p>
      <button onClick={handleSign}>Sign message</button>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  );
}
