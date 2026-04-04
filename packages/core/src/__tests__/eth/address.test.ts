import { describe, it, expect } from "vitest";
import { pubKeyToEthAddress } from "../../eth/address.js";

function fromHex(hex: string): Uint8Array {
  return new Uint8Array(hex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
}

// Known compressed public key ��� EIP-55 checksummed address
const CASES: [string, string][] = [
  [
    "0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798",
    "0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf",
  ],
];

describe("pubKeyToEthAddress", () => {
  it("produces the correct EIP-55 checksummed address", () => {
    for (const [pubHex, expected] of CASES) {
      expect(pubKeyToEthAddress(fromHex(pubHex))).toBe(expected);
    }
  });

  it("output starts with 0x", () => {
    const addr = pubKeyToEthAddress(fromHex(CASES[0][0]));
    expect(addr).toMatch(/^0x[0-9a-fA-F]{40}$/);
  });

  it("output has mixed case (EIP-55 checksum is applied)", () => {
    const addr = pubKeyToEthAddress(fromHex(CASES[0][0]));
    expect(addr).not.toBe(addr.toLowerCase());
  });
});
