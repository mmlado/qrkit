import { decode as cborDecode, type TagDecoder } from "cborg";

import type { ScannedUR } from "../types.js";

export function parseEthSignature(scanned: ScannedUR): string {
  if (scanned.type !== "eth-signature") {
    throw new Error(`Expected eth-signature, got: ${scanned.type}`);
  }

  const map = cborDecode(scanned.cbor, {
    useMaps: true,
    tags: Object.assign([] as TagDecoder[], { 37: (v: unknown) => v }),
  }) as Map<number, unknown>;

  const sigBytes = map.get(2) as Uint8Array | undefined;
  if (!sigBytes || sigBytes.length < 64) {
    throw new Error("Invalid or missing signature bytes");
  }

  return "0x" + [...sigBytes].map((b) => b.toString(16).padStart(2, "0")).join("");
}
