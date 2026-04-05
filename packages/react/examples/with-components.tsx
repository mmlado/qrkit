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

  async function handleSign() {
    if (!account) return;
    try {
      const sig = await sign({
        message: "Hello from My dApp",
        address: account.address,
        sourceFingerprint: account.chain === "evm" ? account.sourceFingerprint : undefined,
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
      <p>Connected: {account.address}</p>
      <button onClick={handleSign}>Sign message</button>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  );
}
