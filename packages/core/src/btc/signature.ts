import { decode as cborDecode, type TagDecoder } from "cborg";

import { bytesToBase64, bytesToHex } from "../bytes.js";
import type { ScannedUR } from "../types.js";

export interface BtcSignature {
  signature: string;
  publicKey: string;
  requestId: string | undefined;
}

export function parseBtcSignature(scanned: ScannedUR): BtcSignature {
  if (scanned.type !== "btc-signature") {
    throw new Error(`Expected btc-signature, got: ${scanned.type}`);
  }

  const map = cborDecode(scanned.cbor, {
    useMaps: true,
    tags: Object.assign([] as TagDecoder[], { 37: (v: unknown) => v }),
  }) as Map<number, unknown>;

  const requestId = map.get(1) as Uint8Array | undefined;
  const sigBytes = map.get(2) as Uint8Array | undefined;
  const publicKeyBytes = map.get(3) as Uint8Array | undefined;

  if (!sigBytes || sigBytes.length !== 65) {
    throw new Error("Invalid or missing BTC signature bytes");
  }
  if (!publicKeyBytes || publicKeyBytes.length !== 33) {
    throw new Error("Invalid or missing BTC public key bytes");
  }

  return {
    signature: bytesToBase64(sigBytes),
    publicKey: bytesToHex(publicKeyBytes),
    requestId: requestId ? bytesToHex(requestId) : undefined,
  };
}
