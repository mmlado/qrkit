import { useCallback, useState } from "react";

import { buildEthSignRequestURParts, parseEthSignature } from "@qrkit/core";
import type { ScannedUR } from "@qrkit/core";

import type { SignRequest } from "../types.js";
import { Modal } from "./Modal.js";
import { QRDisplay } from "./QRDisplay.js";
import { QRScanner } from "./QRScanner.js";

type Step = "display" | "scan";

export interface SignModalProps {
  request: SignRequest;
  appName: string;
  onSign: (signature: string) => void;
  onReject: () => void;
}

export function SignModal({ request, appName, onSign, onReject }: SignModalProps) {
  const [step, setStep] = useState<Step>("display");

  const parts = buildEthSignRequestURParts(
    request.message,
    request.address,
    request.sourceFingerprint,
    appName,
  );

  const handleScan = useCallback(
    (data: ScannedUR | string): boolean | void => {
      try {
        const sig = parseEthSignature(data as ScannedUR);
        onSign(sig);
      } catch {
        return false;
      }
    },
    [onSign],
  );

  return (
    <Modal
      title={step === "display" ? "Sign Request" : "Scan Signature"}
      onClose={onReject}
    >
      {step === "display" && (
        <>
          <p className="qrkit-step">
            Point your hardware wallet camera at this QR code to approve the sign request.
          </p>
          <QRDisplay parts={parts} />
          <button className="qrkit-btn qrkit-btn-primary" onClick={() => setStep("scan")}>
            Wallet signed — scan response
          </button>
          <button className="qrkit-btn qrkit-btn-ghost" onClick={onReject}>
            Cancel
          </button>
        </>
      )}

      {step === "scan" && (
        <>
          <p className="qrkit-step">
            On your hardware wallet, show the signature QR and point it at this camera.
          </p>
          <QRScanner onScan={handleScan} hint="Scan the wallet's signature QR code" />
          <button className="qrkit-btn qrkit-btn-ghost" onClick={() => setStep("display")}>
            ← Back
          </button>
        </>
      )}
    </Modal>
  );
}
