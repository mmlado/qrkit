import { describe, it, expect } from "vitest";

import { parseEthSignature } from "../../eth/signature.js";

function makeEthSignatureCbor(sigBytes: Uint8Array): Uint8Array {
  // Minimal eth-signature CBOR map: { 2: bstr(sigBytes) }
  // map(1) = 0xa1, key 2 = 0x02, bstr(n) = 0x58 n ...
  return new Uint8Array([0xa1, 0x02, 0x58, sigBytes.length, ...sigBytes]);
}

const VALID_SIG = new Uint8Array(65);
VALID_SIG[0] = 27;

describe("parseEthSignature", () => {
  it("returns a 0x-prefixed hex string", () => {
    const result = parseEthSignature({
      type: "eth-signature",
      cbor: makeEthSignatureCbor(VALID_SIG),
    });
    expect(result).toMatch(/^0x[0-9a-f]+$/i);
  });

  it("returns 65 bytes (130 hex chars + 0x prefix)", () => {
    const result = parseEthSignature({
      type: "eth-signature",
      cbor: makeEthSignatureCbor(VALID_SIG),
    });
    expect(result).toHaveLength(132);
  });

  it("throws on wrong UR type", () => {
    expect(() =>
      parseEthSignature({ type: "eth-sign-request", cbor: new Uint8Array() }),
    ).toThrow("Expected eth-signature");
  });

  it("throws when signature bytes are missing", () => {
    // map(0) = 0xa0 — empty map, no key 2
    expect(() =>
      parseEthSignature({ type: "eth-signature", cbor: new Uint8Array([0xa0]) }),
    ).toThrow("Invalid or missing signature bytes");
  });

  it("throws when signature is shorter than 64 bytes", () => {
    const short = new Uint8Array(32);
    expect(() =>
      parseEthSignature({ type: "eth-signature", cbor: makeEthSignatureCbor(short) }),
    ).toThrow("Invalid or missing signature bytes");
  });
});
