import { useQRKit } from "@qrkit/react";

// ERC-4527 data types (mirrors EthDataType from @qrkit/core)
const EthDataType = {
  LegacyTransaction: 1,
  TypedData: 2,
  PersonalMessage: 3,
  TypedTransaction: 4,
} as const;

// RLP-encoded legacy ETH transfer on mainnet (chain 1) for demo purposes.
// Fields: [nonce=0, gasPrice=20Gwei, gasLimit=21000, to=0x…01, value=1, data=∅, v=1(chainId), r=0, s=0]
// List length = 36 bytes → header 0xc0+36 = 0xe4
const LEGACY_TX_BYTES = new Uint8Array([
  0xe4, 0x80, 0x85, 0x04, 0xa8, 0x17, 0xc8, 0x00, 0x82, 0x52, 0x08, 0x94, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x01, 0x01, 0x80, 0x01, 0x80, 0x80,
]);

// EIP-1559 tx: 0x02 prefix + RLP [chainId=1, nonce=0, maxPriorityFee=1Gwei, maxFee=20Gwei,
//   gasLimit=21000, to=0x…01, value=1, data=∅, accessList=∅]
// List length = 40 bytes → header 0xc0+40 = 0xe8
const EIP1559_TX_BYTES = new Uint8Array([
  0x02, 0xe8, 0x01, 0x80, 0x84, 0x3b, 0x9a, 0xca, 0x00, 0x85, 0x04, 0xa8, 0x17, 0xc8,
  0x00, 0x82, 0x52, 0x08, 0x94, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x01, 0x80, 0xc0,
]);

// Minimal EIP-712 typed data hash (domainSeparator ++ structHash)
const TYPED_DATA_BYTES = new TextEncoder().encode(
  JSON.stringify({
    domain: { name: "QRKit Demo", version: "1", chainId: 1 },
    types: {
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
      ],
      Message: [{ name: "content", type: "string" }],
    },
    primaryType: "Message",
    message: { content: "Hello from QRKit Demo" },
  }),
);

const SIGN_CASES = [
  {
    label: "Personal message",
    description: "EIP-191 personal_sign",
    dataType: EthDataType.PersonalMessage,
    signData: "Hello from QRKit Demo",
    chainId: undefined,
  },
  {
    label: "EIP-712 typed data",
    description: "Structured typed data",
    dataType: EthDataType.TypedData,
    signData: TYPED_DATA_BYTES,
    chainId: undefined,
  },
  {
    label: "Legacy transaction",
    description: "EIP-155 (chain 1)",
    dataType: EthDataType.LegacyTransaction,
    signData: LEGACY_TX_BYTES,
    chainId: 1,
  },
  {
    label: "EIP-1559 transaction",
    description: "Type-2 transaction",
    dataType: EthDataType.TypedTransaction,
    signData: EIP1559_TX_BYTES,
    chainId: undefined,
  },
] as const;

const btnBase: React.CSSProperties = {
  padding: "0.6rem 1.2rem",
  fontSize: "0.9rem",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
  background: "var(--qrkit-accent, #6750a4)",
  color: "#fff",
  textAlign: "left",
};

const ghostBtn: React.CSSProperties = {
  ...btnBase,
  background: "transparent",
  border: "1px solid currentColor",
  opacity: 0.7,
  color: "inherit",
};

export function Wallet() {
  const { account, connect, disconnect, sign } = useQRKit();

  async function handleSign(
    signData: Uint8Array | string,
    dataType: number,
    chainId?: number,
  ) {
    if (!account) return;
    try {
      const sig = await sign({
        signData,
        dataType,
        chainId,
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
        <button onClick={connect} style={btnBase}>
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
        gap: "1.25rem",
        alignItems: "center",
        background: "var(--qrkit-surface, #f3f0f4)",
        borderRadius: "12px",
        padding: "2rem",
        minWidth: 340,
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "0.75rem",
          width: "100%",
        }}
      >
        {SIGN_CASES.map((c) => (
          <button
            key={c.label}
            onClick={() => handleSign(c.signData, c.dataType, c.chainId)}
            style={btnBase}
          >
            <div style={{ fontWeight: 600, marginBottom: "0.15rem" }}>{c.label}</div>
            <div style={{ fontSize: "0.75rem", opacity: 0.75 }}>{c.description}</div>
          </button>
        ))}
      </div>

      <button onClick={disconnect} style={ghostBtn}>
        Disconnect
      </button>
    </div>
  );
}
