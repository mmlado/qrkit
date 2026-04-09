import { describe, expect, it } from "vitest";
import { UrFountainDecoder } from "@qrkit/bc-ur-web";

import {
  buildCryptoPsbtUR,
  buildCryptoPsbtURParts,
  parseCryptoPsbt,
} from "../../btc/psbt.js";
import { encode } from "../../cbor.js";

const MINIMAL_PSBT_HEX = "70736274ff01000a0200000000000000000000";
const MINIMAL_PSBT_BYTES = new Uint8Array(
  MINIMAL_PSBT_HEX.match(/.{2}/g)?.map((byte) => parseInt(byte, 16)) ?? [],
);

function cborFromUR(ur: string): Uint8Array {
  const decoder = new UrFountainDecoder();
  decoder.receivePartUr(ur.toLowerCase());
  return decoder.resultUr.getPayloadCbor();
}

describe("buildCryptoPsbtUR", () => {
  it("produces a valid ur:crypto-psbt from PSBT bytes", () => {
    const ur = buildCryptoPsbtUR(MINIMAL_PSBT_BYTES);
    expect(ur.toLowerCase()).toMatch(/^ur:crypto-psbt\//);
  });

  it("accepts PSBT hex strings", () => {
    const parsed = parseCryptoPsbt({
      type: "crypto-psbt",
      cbor: cborFromUR(buildCryptoPsbtUR(MINIMAL_PSBT_HEX)),
    });
    expect(parsed.psbtHex).toBe(MINIMAL_PSBT_HEX);
  });

  it("rejects invalid PSBT hex strings", () => {
    expect(() => buildCryptoPsbtUR("not-hex")).toThrow("Invalid PSBT hex");
  });
});

describe("parseCryptoPsbt", () => {
  it("extracts PSBT bytes and hex from crypto-psbt CBOR", () => {
    const parsed = parseCryptoPsbt({
      type: "crypto-psbt",
      cbor: encode(MINIMAL_PSBT_BYTES),
    });
    expect(parsed.psbt).toEqual(MINIMAL_PSBT_BYTES);
    expect(parsed.psbtHex).toBe(MINIMAL_PSBT_HEX);
  });

  it("round-trips a crypto-psbt UR", () => {
    const ur = buildCryptoPsbtUR(MINIMAL_PSBT_BYTES);
    const parsed = parseCryptoPsbt({ type: "crypto-psbt", cbor: cborFromUR(ur) });
    expect(parsed.psbtHex).toBe(MINIMAL_PSBT_HEX);
  });

  it("throws on wrong UR type", () => {
    expect(() =>
      parseCryptoPsbt({ type: "btc-signature", cbor: encode(MINIMAL_PSBT_BYTES) }),
    ).toThrow("Expected crypto-psbt");
  });

  it("throws when payload is not a byte string", () => {
    expect(() => parseCryptoPsbt({ type: "crypto-psbt", cbor: encode(1) })).toThrow(
      "Invalid crypto-psbt payload",
    );
  });
});

describe("buildCryptoPsbtURParts", () => {
  it("splits a long PSBT into multiple animated UR parts", () => {
    const largePsbt = new Uint8Array(1024);
    largePsbt.set(MINIMAL_PSBT_BYTES);
    const parts = buildCryptoPsbtURParts(largePsbt);
    expect(parts.length).toBeGreaterThan(1);
  });

  it("animated parts reassemble into a valid crypto-psbt", () => {
    const largePsbt = new Uint8Array(1024);
    largePsbt.set(MINIMAL_PSBT_BYTES);
    const parts = buildCryptoPsbtURParts(largePsbt);
    const decoder = new UrFountainDecoder();
    for (const part of parts) {
      decoder.receivePartUr(part.toLowerCase());
    }
    expect(decoder.isComplete()).toBe(true);
    expect(decoder.resultUr.type).toBe("crypto-psbt");
    const parsed = parseCryptoPsbt({
      type: "crypto-psbt",
      cbor: decoder.resultUr.getPayloadCbor(),
    });
    expect(parsed.psbt.slice(0, MINIMAL_PSBT_BYTES.length)).toEqual(MINIMAL_PSBT_BYTES);
  });
});
