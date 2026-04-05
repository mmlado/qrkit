import { useCallback } from "react";

import { parseConnection } from "@qrkit/core";
import type { Account, ScannedUR } from "@qrkit/core";

import { Modal } from "./Modal.js";
import { QRScanner } from "./QRScanner.js";

export interface ConnectModalProps {
  onConnect: (account: Account) => void;
  onClose: () => void;
}

export function ConnectModal({ onConnect, onClose }: ConnectModalProps) {
  const handleScan = useCallback(
    (data: ScannedUR | string): boolean | void => {
      try {
        const accounts = parseConnection(data as ScannedUR, { chains: ["evm"] });
        const account = accounts[0];
        if (!account) return false;
        onConnect(account);
      } catch {
        return false;
      }
    },
    [onConnect],
  );

  return (
    <Modal title="Connect Wallet" onClose={onClose}>
      <p className="qrkit-step">
        On your hardware wallet, go to <strong>Connect software wallet</strong> and point the
        screen at this camera.
      </p>
      <QRScanner onScan={handleScan} hint="Scan the wallet's connection QR code" />
    </Modal>
  );
}
