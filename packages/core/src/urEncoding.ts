import { UR, UREncoder } from "@ngraveio/bc-ur";

export function encodeURParts(
  cbor: Uint8Array,
  type: string,
  maxFragmentLength = 200,
): string[] {
  // @ngraveio/bc-ur requires a Buffer. In Node.js it is a global; in browsers the
  // bundler must provide the `buffer` polyfill (same requirement as the prototype).
  const ur = new UR(Buffer.from(cbor), type);
  const encoder = new UREncoder(ur, maxFragmentLength);
  return Array.from({ length: encoder.fragmentsLength }, () =>
    encoder.nextPart().toUpperCase(),
  );
}

export function encodeURFirstPart(
  cbor: Uint8Array,
  type: string,
  maxFragmentLength = 200,
): string {
  return encodeURParts(cbor, type, maxFragmentLength)[0];
}
