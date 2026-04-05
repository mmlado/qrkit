import { useCallback, useRef, useState } from "react";

import { UrFountainDecoder } from "@qrkit/bc-ur";

import type { ScannedUR } from "@qrkit/core";

export interface UseURDecoderOptions {
  /**
   * Called when a QR string is decoded.
   * Return false to keep scanning (e.g. on parse error), void/true to stop.
   */
  onScan: (result: ScannedUR | string) => boolean | void;
}

export interface UseURDecoderResult {
  /** Feed a raw QR string into the decoder. Returns true when scanning is done. */
  receivePart: (data: string) => boolean;
  /** 0–100 while assembling an animated UR, null otherwise */
  progress: number | null;
  /** Reset decoder state (e.g. to start a new scan) */
  reset: () => void;
}

export function useURDecoder({ onScan }: UseURDecoderOptions): UseURDecoderResult {
  const decoderRef = useRef<UrFountainDecoder>(new UrFountainDecoder());
  const onScanRef = useRef(onScan);
  const [progress, setProgress] = useState<number | null>(null);

  onScanRef.current = onScan;

  const reset = useCallback(() => {
    decoderRef.current = new UrFountainDecoder();
    setProgress(null);
  }, []);

  const receivePart = useCallback(
    (data: string): boolean => {
      if (!data.toLowerCase().startsWith("ur:")) {
        return onScanRef.current(data) !== false;
      }

      decoderRef.current.receivePartUr(data.toLowerCase());
      setProgress(Math.round(decoderRef.current.estimatedPercentComplete() * 100));

      if (!decoderRef.current.isComplete()) return false;

      const ur = decoderRef.current.resultUr;
      const scanned: ScannedUR = { type: ur.type, cbor: ur.getPayloadCbor() };
      if (onScanRef.current(scanned) !== false) return true;

      reset();
      return false;
    },
    [reset],
  );

  return { receivePart, progress, reset };
}
