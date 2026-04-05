import type { ScannedUR } from "@qrkit/core";

import { useQRScanner } from "../hooks/useQRScanner.js";

export interface QRScannerProps {
  onScan: (result: ScannedUR | string) => boolean | void;
  hint?: string;
  enabled?: boolean;
  className?: string;
}

export function QRScanner({ onScan, hint, enabled = true, className }: QRScannerProps) {
  const { videoRef, progress, error } = useQRScanner({ onScan, enabled });

  if (error) {
    return (
      <div className={`qrkit-scanner-error${className ? ` ${className}` : ""}`}>
        {error}
      </div>
    );
  }

  return (
    <div className={`qrkit-scanner-wrap${className ? ` ${className}` : ""}`}>
      <video ref={videoRef} autoPlay playsInline muted className="qrkit-scanner-video" />
      <div className="qrkit-scanner-overlay">
        <div className="qrkit-scanner-corner tl" />
        <div className="qrkit-scanner-corner tr" />
        <div className="qrkit-scanner-corner bl" />
        <div className="qrkit-scanner-corner br" />
      </div>
      {progress !== null && progress < 100 && (
        <div className="qrkit-scanner-progress">{progress}%</div>
      )}
      <p
        className="qrkit-hint"
        style={{ position: "absolute", bottom: 8, left: 0, right: 0 }}
      >
        {progress !== null && progress < 100
          ? "Keep scanning — animated QR in progress…"
          : (hint ?? "Point camera at the QR code")}
      </p>
    </div>
  );
}
