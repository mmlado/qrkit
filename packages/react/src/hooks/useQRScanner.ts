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
  const lastProcessAtRef = useRef(0);
  const lastDetectedCodeRef = useRef<string | null>(null);
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

    const now = performance.now();
    if (now - lastProcessAtRef.current < 100) {
      rafRef.current = requestAnimationFrame(processFrame);
      return;
    }
    lastProcessAtRef.current = now;

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
          if (code.data !== lastDetectedCodeRef.current) {
            lastDetectedCodeRef.current = code.data;
            console.log("[qrkit] QR code detected", {
              length: code.data.length,
              preview: code.data.slice(0, 80),
            });
          }

          const done = receivePartRef.current(code.data);
          if (done) {
            console.log("[qrkit] QR scanner finished");
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
    lastProcessAtRef.current = 0;
    lastDetectedCodeRef.current = null;
    canvasRef.current = document.createElement("canvas");
    console.log("[qrkit] QR scanner starting");

    let stream: MediaStream | null = null;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((s) => {
        stream = s;
        console.log("[qrkit] Camera stream acquired");
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
          rafRef.current = requestAnimationFrame(processFrame);
        }
      })
      .catch(() => {
        console.warn("[qrkit] Camera access denied");
        setError("Camera access denied. Please allow camera permissions.");
      });

    return () => {
      console.log("[qrkit] QR scanner stopping");
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      stream?.getTracks().forEach((t) => t.stop());
      canvasRef.current = null;
    };
  }, [enabled, processFrame]);

  return { videoRef, progress, error };
}
