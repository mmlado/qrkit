import { describe, it, expect } from "vitest";

import { parseXpub } from "../parseXpub.js";
import { ETH_HDKEY_UR, SOURCE_FINGERPRINT, urToCbor } from "./fixtures.js";

describe("parseXpub — UR crypto-hdkey", () => {
  it("parses purpose and coinType from the ETH key UR", () => {
    const [parsed] = parseXpub({ type: "crypto-hdkey", cbor: urToCbor(ETH_HDKEY_UR) });
    expect(parsed.purpose).toBe(44);
    expect(parsed.coinType).toBe(60);
    expect(parsed.type).toBe("xpub");
  });

  it("extracts source-fingerprint", () => {
    const [parsed] = parseXpub({ type: "crypto-hdkey", cbor: urToCbor(ETH_HDKEY_UR) });
    expect(parsed.sourceFingerprint).toBe(SOURCE_FINGERPRINT);
  });

  it("returns an HDKey that can derive child keys", () => {
    const [parsed] = parseXpub({ type: "crypto-hdkey", cbor: urToCbor(ETH_HDKEY_UR) });
    const child = parsed.hdKey.deriveChild(0).deriveChild(0);
    expect(child.publicKey).toHaveLength(33);
  });

  it("throws on unsupported UR type", () => {
    expect(() => parseXpub({ type: "eth-signature", cbor: new Uint8Array() })).toThrow(
      "Unsupported UR type",
    );
  });
});

describe("parseXpub — raw base58 xpub", () => {
  it("parses a standard xpub string", () => {
    const xpub =
      "xpub661MyMwAqRbcFtXgS5sYJABqqG9YLmC4Q1Rdap9gSE8NqtwybGhePY2gZ29ESFjqJoCu1Rupje8YtGqsefD265TMg7usUDFdp6W1EGMcet8";
    const [parsed] = parseXpub(xpub);
    expect(parsed.type).toBe("xpub");
    expect(parsed.purpose).toBeUndefined();
    expect(parsed.hdKey).toBeDefined();
  });

  it("rejects garbage input", () => {
    expect(() => parseXpub("not-a-key")).toThrow();
  });
});
