import { useQRKit } from "@qrkit/react";

import { buildDemoBip322Psbt, buildDemoTransactionPsbt } from "./btcPsbtDemo.js";
import { BTC_MESSAGE, BTC_SIGN_CASES, EVM_SIGN_CASES } from "./walletDemoData.js";
import {
  accountDetails,
  accountTitle,
  btcScriptTypeLabel,
  formatSignResult,
} from "./walletDisplay.js";

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

  async function handleEvmSign(
    signData: Uint8Array | string,
    dataType: number,
    chainId?: number,
  ) {
    if (!account || account.chain !== "evm") return;

    try {
      const result = await sign({
        signData,
        dataType,
        chainId,
        address: account.address,
        sourceFingerprint: account.sourceFingerprint,
      });
      alert(`Signature:\n${formatSignResult(result)}`);
    } catch {
      // dismissed
    }
  }

  async function handleBtcMessageSign() {
    if (!account || account.chain !== "btc") return;

    try {
      const result = await sign({
        chain: "btc",
        requestType: "message",
        signData: BTC_MESSAGE,
        address: account.address,
        scriptType: account.scriptType,
        sourceFingerprint: account.sourceFingerprint,
      });
      alert(`Signature:\n${formatSignResult(result)}`);
    } catch {
      // dismissed
    }
  }

  async function handleBtcPsbtSign(kind: "transaction" | "bip322", title: string) {
    if (!account || account.chain !== "btc") return;

    try {
      const result = await sign({
        chain: "btc",
        requestType: "psbt",
        psbt:
          kind === "transaction"
            ? buildDemoTransactionPsbt(account)
            : buildDemoBip322Psbt(account),
      });
      alert(`${title}:\n${formatSignResult(result)}`);
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
          {accountTitle(account)}
        </div>
        <div style={{ opacity: 0.65, fontSize: "0.8rem", marginBottom: "0.35rem" }}>
          {accountDetails(account)}
          {account.device ? `  •  ${account.device}` : ""}
        </div>
        <code style={{ fontSize: "0.85rem", wordBreak: "break-all" }}>
          {account.address}
        </code>
      </div>

      {account.chain === "evm" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "0.75rem",
            width: "100%",
          }}
        >
          {EVM_SIGN_CASES.map((c) => (
            <button
              key={c.label}
              onClick={() => handleEvmSign(c.signData, c.dataType, c.chainId)}
              style={btnBase}
            >
              <div style={{ fontWeight: 600, marginBottom: "0.15rem" }}>{c.label}</div>
              <div style={{ fontSize: "0.75rem", opacity: 0.75 }}>{c.description}</div>
            </button>
          ))}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "0.75rem",
            width: "100%",
          }}
        >
          {BTC_SIGN_CASES.map((c) => (
            <button
              key={c.label}
              onClick={() =>
                c.requestType === "message"
                  ? handleBtcMessageSign()
                  : handleBtcPsbtSign(c.psbtKind, c.label)
              }
              style={btnBase}
            >
              <div style={{ fontWeight: 600, marginBottom: "0.15rem" }}>{c.label}</div>
              <div style={{ fontSize: "0.75rem", opacity: 0.75 }}>
                {c.requestType === "message"
                  ? `${c.description} with ${btcScriptTypeLabel(account.scriptType)}`
                  : c.description}
              </div>
            </button>
          ))}
        </div>
      )}

      <button onClick={disconnect} style={ghostBtn}>
        Disconnect
      </button>
    </div>
  );
}
