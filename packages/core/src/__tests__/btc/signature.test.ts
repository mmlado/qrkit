import { describe, expect, it } from "vitest";

import { parseBtcSignature } from "../../btc/signature.js";
import { CborTag, encode } from "../../cbor.js";

const REQUEST_ID = new Uint8Array([
  0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b, 0x0c, 0x0d,
  0x0e, 0x0f,
]);

const VALID_SIG = new Uint8Array(65);
VALID_SIG[0] = 27;

const VALID_PUBLIC_KEY = new Uint8Array([
  0x02, 0x79, 0xbe, 0x66, 0x7e, 0xf9, 0xdc, 0xbb, 0xac, 0x55, 0xa0, 0x62, 0x95, 0xce,
  0x87, 0x0b, 0x07, 0x02, 0x9b, 0xfc, 0xdb, 0x2d, 0xce, 0x28, 0xd9, 0x59, 0xf2, 0x81,
  0x5b, 0x16, 0xf8, 0x17, 0x98,
]);

function makeBtcSignatureCbor(
  sigBytes = VALID_SIG,
  publicKeyBytes = VALID_PUBLIC_KEY,
): Uint8Array {
  return encode(
    new Map<number, unknown>([
      [1, new CborTag(37, REQUEST_ID)],
      [2, sigBytes],
      [3, publicKeyBytes],
    ]),
  );
}

describe("parseBtcSignature", () => {
  it("returns a base64 signature, public key hex, and request id hex", () => {
    const result = parseBtcSignature({
      type: "btc-signature",
      cbor: makeBtcSignatureCbor(),
    });

    expect(result.signature).toBe(btoa(String.fromCharCode(...VALID_SIG)));
    expect(result.publicKey).toBe(
      "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
    );
    expect(result.requestId).toBe("000102030405060708090a0b0c0d0e0f");
  });

  it("throws on wrong UR type", () => {
    expect(() =>
      parseBtcSignature({ type: "btc-sign-request", cbor: new Uint8Array() }),
    ).toThrow("Expected btc-signature");
  });

  it("throws when signature bytes are missing", () => {
    expect(() =>
      parseBtcSignature({ type: "btc-signature", cbor: encode(new Map()) }),
    ).toThrow("Invalid or missing BTC signature bytes");
  });

  it("throws when signature is not 65 bytes", () => {
    expect(() =>
      parseBtcSignature({
        type: "btc-signature",
        cbor: makeBtcSignatureCbor(new Uint8Array(64)),
      }),
    ).toThrow("Invalid or missing BTC signature bytes");
  });

  it("throws when public key is not 33 bytes", () => {
    expect(() =>
      parseBtcSignature({
        type: "btc-signature",
        cbor: makeBtcSignatureCbor(VALID_SIG, new Uint8Array(32)),
      }),
    ).toThrow("Invalid or missing BTC public key bytes");
  });
});
