import { QRKitProvider } from "@qrkit/react";

import { Wallet } from "./Wallet.js";

export function App() {
  return (
    <QRKitProvider appName="QRKit Demo">
      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          padding: "2rem",
        }}
      >
        <h1 style={{ marginBottom: "0.5rem" }}>QRKit Demo</h1>
        <p style={{ marginBottom: "2rem", opacity: 0.6 }}>
          Airgapped wallet connection via QR codes
        </p>
        <Wallet />
      </main>
    </QRKitProvider>
  );
}
