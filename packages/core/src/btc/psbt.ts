import { decode as cborDecode } from "cborg";

import { bytesToHex, hexToBytes } from "../bytes.js";
import { encode } from "../cbor.js";
import type { ScannedUR } from "../types.js";
import { encodeURParts } from "../urEncoding.js";

export interface CryptoPsbt {
  psbt: Uint8Array;
  psbtHex: string;
}

function normalizePsbt(psbt: Uint8Array | string): Uint8Array {
  try {
    return typeof psbt === "string" ? hexToBytes(psbt) : psbt;
  } catch (error) {
    throw new Error("Invalid PSBT hex", { cause: error });
  }
}

export function parseCryptoPsbt(scanned: ScannedUR): CryptoPsbt {
  if (scanned.type !== "crypto-psbt") {
    throw new Error(`Expected crypto-psbt, got: ${scanned.type}`);
  }

  const psbt = cborDecode(scanned.cbor) as unknown;
  if (!(psbt instanceof Uint8Array)) {
    throw new Error("Invalid crypto-psbt payload");
  }

  return {
    psbt,
    psbtHex: bytesToHex(psbt),
  };
}

export function buildCryptoPsbtURParts(psbt: Uint8Array | string): string[] {
  return encodeURParts(encode(normalizePsbt(psbt)), "crypto-psbt");
}

export function buildCryptoPsbtUR(psbt: Uint8Array | string): string {
  return buildCryptoPsbtURParts(psbt)[0];
}
