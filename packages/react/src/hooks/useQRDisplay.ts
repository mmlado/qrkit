import { useEffect, useRef } from "react";

import QRCode from "qrcode";

import { useQRParts } from "./useQRParts.js";

export interface UseQRDisplayOptions {
  /** QR parts to cycle through. Single-frame: pass an array with one element. */
  parts: string[];
  /** Interval between frames in ms. Default: 200 */
  interval?: number;
  /** Canvas size in pixels. Default: 300 */
  size?: number;
}

export interface UseQRDisplayResult {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  /** Current frame index */
  frame: number;
  total: number;
}

export function useQRDisplay({
  parts,
  interval,
  size = 300,
}: UseQRDisplayOptions): UseQRDisplayResult {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { part, frame, total } = useQRParts({ parts, interval });

  useEffect(() => {
    if (!part || !canvasRef.current) return;

    QRCode.toCanvas(canvasRef.current, part, {
      width: size,
      margin: 2,
      errorCorrectionLevel: "M",
    }).catch(() => {
      // ignore render errors
    });
  }, [part, size]);

  return { canvasRef, frame, total };
}
