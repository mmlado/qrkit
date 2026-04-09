import { describe, it, expect } from "vitest";

import { encode } from "../cbor.js";
import { parseXpub } from "../parseXpub.js";
import {
  cryptoAccountCbor,
  ETH_HDKEY_UR,
  SOURCE_FINGERPRINT,
  DEVICE_NAME,
  MULTI_ACCOUNT_DEVICE_NAME,
  multiAccountCbor,
  urToCbor,
} from "./fixtures.js";

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

  it("extracts the device name from key 9 when set by the wallet", () => {
    const [parsed] = parseXpub({ type: "crypto-hdkey", cbor: urToCbor(ETH_HDKEY_UR) });
    expect(parsed.name).toBe(DEVICE_NAME);
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

describe("parseXpub — UR crypto-multi-accounts", () => {
  it("parses all bundled account-level xpubs", () => {
    const parsed = parseXpub({ type: "crypto-multi-accounts", cbor: multiAccountCbor() });
    expect(parsed).toHaveLength(4);
    expect(parsed.map((entry) => [entry.purpose, entry.coinType])).toEqual([
      [84, 0],
      [49, 0],
      [44, 0],
      [44, 60],
    ]);
  });

  it("uses the outer device name as a fallback", () => {
    const parsed = parseXpub({ type: "crypto-multi-accounts", cbor: multiAccountCbor() });
    expect(parsed[0].name).toBe(MULTI_ACCOUNT_DEVICE_NAME);
    expect(parsed[2].name).toBe("Legacy BTC Key");
  });

  it("fails when an account entry does not contain a crypto-hdkey shape", () => {
    const malformed = encode(
      new Map<number, unknown>([
        [1, SOURCE_FINGERPRINT],
        [2, [new Map<number, unknown>([[9, "not-an-hdkey"]])]],
        [3, MULTI_ACCOUNT_DEVICE_NAME],
      ]),
    );

    expect(() => parseXpub({ type: "crypto-multi-accounts", cbor: malformed })).toThrow(
      "crypto-hdkey missing key-data or chain-code",
    );
  });
});

describe("parseXpub — UR crypto-account", () => {
  it("parses BTC crypto-account exports wrapped in script-expression tags", () => {
    const parsed = parseXpub({ type: "crypto-account", cbor: cryptoAccountCbor() });
    expect(parsed.map((entry) => [entry.purpose, entry.coinType, entry.name])).toEqual([
      [84, 0, "GapSign"],
      [49, 0, "GapSign"],
      [44, 0, "GapSign"],
    ]);
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
