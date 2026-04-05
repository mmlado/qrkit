import { useQRKit } from "@qrkit/react";

export function Wallet() {
  const { account, connect, disconnect, sign } = useQRKit();

  async function handleSign() {
    if (!account) return;
    try {
      const sig = await sign({
        message: "Hello from QRKit Demo",
        address: account.address,
        sourceFingerprint:
          account.chain === "evm" ? account.sourceFingerprint : undefined,
      });
      alert(`Signature:\n${sig}`);
    } catch {
      // dismissed
    }
  }

  if (!account) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          alignItems: "center",
        }}
      >
        <p style={{ opacity: 0.6, textAlign: "center", maxWidth: 360 }}>
          Connect an airgapped wallet (Shell, Keystone, or any ERC-4527 compatible device)
          by scanning its QR code.
        </p>
        <button
          className="qrkit"
          onClick={connect}
          style={{
            padding: "0.75rem 2rem",
            fontSize: "1rem",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            background: "var(--qrkit-accent, #6750a4)",
            color: "#fff",
          }}
        >
          Connect wallet
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        alignItems: "center",
        background: "var(--qrkit-surface, #f3f0f4)",
        borderRadius: "12px",
        padding: "2rem",
        minWidth: 320,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div style={{ opacity: 0.5, fontSize: "0.8rem", marginBottom: "0.25rem" }}>
          Connected
        </div>
        <code style={{ fontSize: "0.85rem", wordBreak: "break-all" }}>
          {account.address}
        </code>
      </div>
      <div style={{ display: "flex", gap: "0.75rem" }}>
        <button
          onClick={handleSign}
          style={{
            padding: "0.6rem 1.5rem",
            fontSize: "0.95rem",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            background: "var(--qrkit-accent, #6750a4)",
            color: "#fff",
          }}
        >
          Sign message
        </button>
        <button
          onClick={disconnect}
          style={{
            padding: "0.6rem 1.5rem",
            fontSize: "0.95rem",
            borderRadius: "8px",
            border: "1px solid currentColor",
            cursor: "pointer",
            background: "transparent",
            opacity: 0.7,
          }}
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}
