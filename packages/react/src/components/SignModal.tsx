import { useCallback, useState } from "react";

import {
  buildBtcSignRequestURParts,
  buildCryptoPsbtURParts,
  buildEthSignRequestURParts,
  parseBtcSignature,
  parseCryptoPsbt,
  parseEthSignature,
} from "@qrkit/core";
import type { ScannedUR } from "@qrkit/core";

import type {
  BtcMessageSignRequest,
  BtcPsbtSignRequest,
  EvmSignRequest,
  SignRequest,
  SignResult,
} from "../types.js";
import { Modal } from "./Modal.js";
import { QRDisplay } from "./QRDisplay.js";
import { QRScanner } from "./QRScanner.js";

type Step = "display" | "scan";

export interface SignModalProps {
  request: SignRequest;
  appName: string;
  onSign: (result: SignResult) => void;
  onReject: () => void;
}

function isBtcMessageRequest(request: SignRequest): request is BtcMessageSignRequest {
  return request.chain === "btc" && request.requestType === "message";
}

function isBtcPsbtRequest(request: SignRequest): request is BtcPsbtSignRequest {
  return request.chain === "btc" && request.requestType === "psbt";
}

function buildParts(request: SignRequest, appName: string): string[] {
  if (isBtcMessageRequest(request)) {
    return buildBtcSignRequestURParts({
      signData: request.signData,
      address: request.address,
      scriptType: request.scriptType,
      sourceFingerprint: request.sourceFingerprint,
      origin: appName,
    });
  }

  if (isBtcPsbtRequest(request)) {
    return buildCryptoPsbtURParts(request.psbt);
  }

  const evmRequest = request as EvmSignRequest;
  return buildEthSignRequestURParts({
    signData: evmRequest.signData,
    dataType: evmRequest.dataType,
    address: evmRequest.address,
    sourceFingerprint: evmRequest.sourceFingerprint,
    chainId: evmRequest.chainId,
    origin: appName,
  });
}

function parseSignResponse(request: SignRequest, data: ScannedUR): SignResult {
  if (isBtcMessageRequest(request)) return parseBtcSignature(data);
  if (isBtcPsbtRequest(request)) return parseCryptoPsbt(data);
  return parseEthSignature(data);
}

export function SignModal({ request, appName, onSign, onReject }: SignModalProps) {
  const [step, setStep] = useState<Step>("display");
  const parts = buildParts(request, appName);

  const handleScan = useCallback(
    (data: ScannedUR | string): boolean | void => {
      try {
        console.log("[qrkit] Sign QR received", {
          inputType: typeof data === "string" ? "string" : data.type,
          cborLength: typeof data === "string" ? undefined : data.cbor.length,
        });
        const parsed = parseSignResponse(request, data as ScannedUR);
        console.log("[qrkit] Sign QR parsed", {
          requestChain: request.chain ?? "evm",
          requestType: request.chain === "btc" ? request.requestType : "evm-signature",
          resultType:
            typeof parsed === "string"
              ? "evm-signature"
              : "psbtHex" in parsed
                ? "crypto-psbt"
                : "btc-signature",
        });
        onSign(parsed);
      } catch (error) {
        console.warn("[qrkit] Failed to parse sign response", error);
        return false;
      }
    },
    [onSign, request],
  );

  return (
    <Modal
      title={step === "display" ? "Sign Request" : "Scan Response"}
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
          <button
            className="qrkit-btn qrkit-btn-ghost"
            onClick={() => setStep("display")}
          >
            ← Back
          </button>
        </>
      )}
    </Modal>
  );
}
