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
        <p style={{ marginBottom: "0.75rem", fontSize: "0.85rem", opacity: 0.55 }}>
          Tested with{" "}
          <a
            href="https://get.keycard.tech/mmlado"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit" }}
          >
            Shell
          </a>{" "}
          and{" "}
          <a
            href="https://github.com/mmlado/GapSign"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit" }}
          >
            GapSign
          </a>
        </p>
        <p style={{ marginBottom: "2rem", fontSize: "0.85rem", opacity: 0.4 }}>
          <a
            href="https://github.com/mmlado/qrkit"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "inherit" }}
          >
            github.com/mmlado/qrkit
          </a>
        </p>
        <Wallet />
      </main>
    </QRKitProvider>
  );
}
