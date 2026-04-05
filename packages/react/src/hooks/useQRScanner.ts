import { useCallback, useEffect, useRef, useState } from "react";

import QrScanner from "qr-scanner";

import type { ScannedUR } from "@qrkit/core";

import { useURDecoder } from "./useURDecoder.js";

export interface UseQRScannerOptions {
  /**
   * Called when a QR code is decoded.
   * Return false to keep scanning (e.g. on parse error), void/true to stop.
   */
  onScan: (result: ScannedUR | string) => boolean | void;
  enabled?: boolean;
}

export interface UseQRScannerResult {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** 0–100 while scanning an animated UR, null otherwise */
  progress: number | null;
  error: string | null;
}

export function useQRScanner({
  onScan,
  enabled = true,
}: UseQRScannerOptions): UseQRScannerResult {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { receivePart, progress } = useURDecoder({ onScan });

  const processResult = useCallback(
    (data: string, scanner: QrScanner): void => {
      const done = receivePart(data);
      if (done) scanner.stop();
    },
    [receivePart],
  );

  useEffect(() => {
    if (!enabled || !videoRef.current) return;

    const scanner = new QrScanner(
      videoRef.current,
      (result) => processResult(result.data, scanner),
      {
        preferredCamera: "environment",
        highlightScanRegion: false,
        highlightCodeOutline: false,
      },
    );

    scannerRef.current = scanner;

    scanner.start().catch(() => {
      setError("Camera access denied. Please allow camera permissions.");
    });

    return () => {
      scanner.stop();
      scanner.destroy();
      scannerRef.current = null;
    };
  }, [enabled, processResult]);

  return { videoRef, progress, error };
}
