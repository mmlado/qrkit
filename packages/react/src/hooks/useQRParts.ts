import { useEffect, useRef, useState } from "react";

export interface UseQRPartsOptions {
  /** QR parts to cycle through. Single-frame: pass an array with one element. */
  parts: string[];
  /** Interval between frames in ms. Default: 200 */
  interval?: number;
}

export interface UseQRPartsResult {
  /** The current QR string to render */
  part: string;
  /** Current frame index (0-based) */
  frame: number;
  total: number;
}

export function useQRParts({
  parts,
  interval = 200,
}: UseQRPartsOptions): UseQRPartsResult {
  const [frame, setFrame] = useState(0);
  const frameRef = useRef(0);

  useEffect(() => {
    frameRef.current = 0;
    setFrame(0);
  }, [parts]);

  useEffect(() => {
    if (parts.length <= 1) return;

    const id = setInterval(() => {
      frameRef.current = (frameRef.current + 1) % parts.length;
      setFrame(frameRef.current);
    }, interval);

    return () => clearInterval(id);
  }, [parts, interval]);

  return {
    part: parts[frameRef.current % Math.max(parts.length, 1)] ?? "",
    frame,
    total: parts.length,
  };
}
