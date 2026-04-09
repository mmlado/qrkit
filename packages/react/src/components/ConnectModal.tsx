import { useCallback, useState } from "react";

import { parseConnection } from "@qrkit/core";
import type { Account, Chain, ScannedUR } from "@qrkit/core";

import { Modal } from "./Modal.js";
import { QRScanner } from "./QRScanner.js";

export interface ConnectModalProps {
  chains?: Chain[];
  onConnect: (account: Account) => void;
  onClose: () => void;
}

function btcScriptTypeLabel(scriptType: "p2wpkh" | "p2sh-p2wpkh" | "p2pkh"): string {
  if (scriptType === "p2wpkh") return "Native SegWit";
  if (scriptType === "p2sh-p2wpkh") return "Nested SegWit";
  return "Legacy";
}

function accountLabel(account: Account): string {
  if (account.chain === "evm") return `Ethereum ${account.address}`;
  return `Bitcoin ${btcScriptTypeLabel(account.scriptType)} ${account.address}`;
}

export function ConnectModal({
  chains = ["evm", "btc"],
  onConnect,
  onClose,
}: ConnectModalProps) {
  const [accounts, setAccounts] = useState<Account[] | null>(null);

  const handleScan = useCallback(
    (data: ScannedUR | string): boolean | void => {
      try {
        console.log("[qrkit] Connect QR received", {
          inputType: typeof data === "string" ? "string" : data.type,
          cborLength: typeof data === "string" ? undefined : data.cbor.length,
          chains,
        });
        const parsed = parseConnection(data as ScannedUR, { chains });
        console.log("[qrkit] Connect QR parsed", {
          accountCount: parsed.length,
          accounts: parsed.map((account) => ({
            chain: account.chain,
            address: account.address,
            device: account.device,
            scriptType: account.chain === "btc" ? account.scriptType : undefined,
          })),
        });
        if (parsed.length === 0) {
          console.log("[qrkit] Connect QR had no matching accounts", { chains });
          return false;
        }
        if (parsed.length === 1) {
          console.log("[qrkit] Connecting single account", {
            chain: parsed[0].chain,
            address: parsed[0].address,
          });
          onConnect(parsed[0]);
          return true;
        }
        console.log("[qrkit] Showing account picker", { accountCount: parsed.length });
        setAccounts(parsed);
        return true;
      } catch (error) {
        console.warn("Failed to parse connection QR", error);
        return false;
      }
    },
    [chains, onConnect],
  );

  return (
    <Modal title="Connect Wallet" onClose={onClose}>
      {accounts ? (
        <>
          <p className="qrkit-step">Choose the account to connect.</p>
          <div className="qrkit-account-list">
            {accounts.map((account) => (
              <button
                className="qrkit-account-option"
                key={`${account.chain}:${account.address}:${account.publicKey}`}
                onClick={() => onConnect(account)}
              >
                <span className="qrkit-account-chain">
                  {account.chain === "evm"
                    ? "Ethereum"
                    : `Bitcoin ${btcScriptTypeLabel(account.scriptType)}`}
                </span>
                <span className="qrkit-account-address">{accountLabel(account)}</span>
              </button>
            ))}
          </div>
          <button className="qrkit-btn qrkit-btn-ghost" onClick={() => setAccounts(null)}>
            Scan another QR
          </button>
        </>
      ) : (
        <>
          <p className="qrkit-step">
            On your hardware wallet, go to <strong>Connect software wallet</strong> and
            point the screen at this camera.
          </p>
          <QRScanner onScan={handleScan} hint="Scan the wallet's connection QR code" />
        </>
      )}
    </Modal>
  );
}
