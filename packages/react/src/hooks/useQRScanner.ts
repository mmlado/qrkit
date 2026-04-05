import { useCallback, useEffect, useRef, useState } from "react";

import jsQR from "jsqr";

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
  const rafRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const doneRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const { receivePart, progress } = useURDecoder({ onScan });

  const receivePartRef = useRef(receivePart);
  receivePartRef.current = receivePart;

  const processFrame = useCallback((): void => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || doneRef.current) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      let imageData: ImageData;
      try {
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      } catch {
        setError(
          "Canvas access blocked. Disable fingerprinting protection for this site to scan QR codes.",
        );
        return;
      }
      {
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code) {
          const done = receivePartRef.current(code.data);
          if (done) {
            doneRef.current = true;
            return;
          }
        }
      }
    }

    rafRef.current = requestAnimationFrame(processFrame);
  }, []);

  useEffect(() => {
    if (!enabled || !videoRef.current) return;

    doneRef.current = false;
    canvasRef.current = document.createElement("canvas");

    let stream: MediaStream | null = null;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
          rafRef.current = requestAnimationFrame(processFrame);
        }
      })
      .catch(() => {
        setError("Camera access denied. Please allow camera permissions.");
      });

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      stream?.getTracks().forEach((t) => t.stop());
      canvasRef.current = null;
    };
  }, [enabled, processFrame]);

  return { videoRef, progress, error };
}
