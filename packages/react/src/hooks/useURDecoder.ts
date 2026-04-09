import { useCallback, useRef, useState } from "react";

import { UrFountainDecoder } from "@qrkit/bc-ur-web";

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

function describeUrPart(data: string): Record<string, unknown> {
  const parts = data.split("/");
  const type = parts[0]?.slice("ur:".length);
  const sequence = parts.length === 3 ? parts[1] : undefined;
  const [sequenceNumber, sequenceLength] = sequence?.split("-").map(Number) ?? [];

  return {
    type,
    sequenceNumber,
    sequenceLength,
    length: data.length,
    preview: data.slice(0, 80),
  };
}

export function useURDecoder({ onScan }: UseURDecoderOptions): UseURDecoderResult {
  const decoderRef = useRef<UrFountainDecoder>(new UrFountainDecoder());
  const onScanRef = useRef(onScan);
  const completedRef = useRef(false);
  const [progress, setProgress] = useState<number | null>(null);

  onScanRef.current = onScan;

  const reset = useCallback(() => {
    console.log("[qrkit] UR decoder reset");
    decoderRef.current = new UrFountainDecoder();
    completedRef.current = false;
    setProgress(null);
  }, []);

  const receivePart = useCallback(
    (data: string): boolean => {
      if (completedRef.current) return true;

      const normalized = data.toLowerCase();
      if (!normalized.startsWith("ur:")) {
        console.log("[qrkit] Non-UR scan result", {
          length: data.length,
          preview: data.slice(0, 80),
        });
        return onScanRef.current(data) !== false;
      }

      const description = describeUrPart(normalized);
      const accepted = decoderRef.current.receivePartUr(normalized);
      const decodedProgress = Math.round(decoderRef.current.getProgress() * 100);
      const estimatedProgress = Math.round(
        decoderRef.current.estimatedPercentComplete() * 100,
      );
      const isComplete = decoderRef.current.isComplete();
      setProgress(decodedProgress);

      console.log("[qrkit] UR frame received", {
        ...description,
        accepted,
        decodedProgress,
        estimatedProgress,
        isComplete,
      });

      if (!isComplete) return false;

      const ur = decoderRef.current.resultUr;
      const cbor = ur.getPayloadCbor();
      console.log("[qrkit] UR complete", { type: ur.type, cborLength: cbor.length });
      const scanned: ScannedUR = { type: ur.type, cbor };
      if (onScanRef.current(scanned) !== false) {
        console.log("[qrkit] Scan accepted by consumer", { type: ur.type });
        completedRef.current = true;
        return true;
      }

      console.log("[qrkit] Scan rejected by consumer, resetting decoder", {
        type: ur.type,
      });
      reset();
      return false;
    },
    [reset],
  );

  return { receivePart, progress, reset };
}
