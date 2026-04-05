import { UR, UrFountainEncoder } from "@qrkit/bc-ur";

export function encodeURParts(
  cbor: Uint8Array,
  type: string,
  maxFragmentLength = 200,
): string[] {
  const ur = UR.fromCbor({ type, payload: cbor });
  const encoder = new UrFountainEncoder(ur, maxFragmentLength);
  return encoder.getAllPartsUr().map((part) => part.toString().toUpperCase());
}
