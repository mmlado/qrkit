import { describe, expect, it } from "vitest";
import { decode, type TagDecoder } from "cborg";
import { UrFountainDecoder } from "@qrkit/bc-ur-web";

import {
  BtcDataType,
  buildBtcSignRequestUR,
  buildBtcSignRequestURParts,
} from "../../btc/signRequest.js";
import {
  BTC_LEGACY_ADDRESS,
  BTC_NATIVE_SEGWIT_ADDRESS,
  BTC_NESTED_SEGWIT_ADDRESS,
  MULTI_ACCOUNT_SOURCE_FINGERPRINT,
} from "../fixtures.js";

function decodeSignRequestUR(ur: string) {
  const decoder = new UrFountainDecoder();
  decoder.receivePartUr(ur.toLowerCase());
  const result = decoder.resultUr;
  return {
    type: result.type,
    map: decode(result.getPayloadCbor(), {
      useMaps: true,
      tags: Object.assign([] as TagDecoder[], {
        37: (v: unknown) => v,
        304: (v: unknown) => v,
      }),
    }) as Map<number, unknown>,
  };
}

const BASE_PARAMS = {
  signData: "Hello Bitcoin",
  address: BTC_NATIVE_SEGWIT_ADDRESS,
  scriptType: "p2wpkh",
  sourceFingerprint: MULTI_ACCOUNT_SOURCE_FINGERPRINT,
} as const;

describe("buildBtcSignRequestUR", () => {
  it("produces a valid ur:btc-sign-request", () => {
    const ur = buildBtcSignRequestUR(BASE_PARAMS);
    expect(ur.toLowerCase()).toMatch(/^ur:btc-sign-request\//);
  });

  it("sets data-type to 1 for BTC messages", () => {
    const { map } = decodeSignRequestUR(buildBtcSignRequestUR(BASE_PARAMS));
    expect(map.get(3)).toBe(BtcDataType.Message);
  });

  it("encodes a string signData as UTF-8 bytes", () => {
    const { map } = decodeSignRequestUR(buildBtcSignRequestUR(BASE_PARAMS));
    expect(new TextDecoder().decode(map.get(2) as Uint8Array)).toBe("Hello Bitcoin");
  });

  it("passes Uint8Array signData through unchanged", () => {
    const signData = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
    const { map } = decodeSignRequestUR(
      buildBtcSignRequestUR({
        ...BASE_PARAMS,
        signData,
      }),
    );
    expect(map.get(2)).toEqual(signData);
  });

  it("encodes addresses as an array of text strings", () => {
    const { map } = decodeSignRequestUR(buildBtcSignRequestUR(BASE_PARAMS));
    expect(map.get(5)).toEqual([BTC_NATIVE_SEGWIT_ADDRESS]);
  });

  it("includes derivation path m/84'/0'/0'/0/0 for native SegWit", () => {
    const { map } = decodeSignRequestUR(buildBtcSignRequestUR(BASE_PARAMS));
    const [keypath] = map.get(4) as Map<number, unknown>[];
    expect(keypath?.get(1)).toEqual([84, true, 0, true, 0, true, 0, false, 0, false]);
  });

  it("includes derivation path m/49'/0'/0'/0/0 for nested SegWit", () => {
    const { map } = decodeSignRequestUR(
      buildBtcSignRequestUR({
        ...BASE_PARAMS,
        address: BTC_NESTED_SEGWIT_ADDRESS,
        scriptType: "p2sh-p2wpkh",
      }),
    );
    const [keypath] = map.get(4) as Map<number, unknown>[];
    expect(keypath?.get(1)).toEqual([49, true, 0, true, 0, true, 0, false, 0, false]);
  });

  it("includes derivation path m/44'/0'/0'/0/0 for legacy", () => {
    const { map } = decodeSignRequestUR(
      buildBtcSignRequestUR({
        ...BASE_PARAMS,
        address: BTC_LEGACY_ADDRESS,
        scriptType: "p2pkh",
      }),
    );
    const [keypath] = map.get(4) as Map<number, unknown>[];
    expect(keypath?.get(1)).toEqual([44, true, 0, true, 0, true, 0, false, 0, false]);
  });

  it("includes source-fingerprint in the keypath", () => {
    const { map } = decodeSignRequestUR(buildBtcSignRequestUR(BASE_PARAMS));
    const [keypath] = map.get(4) as Map<number, unknown>[];
    expect(keypath?.get(2)).toBe(MULTI_ACCOUNT_SOURCE_FINGERPRINT);
  });

  it("wraps request-id in CBOR tag 37 (UUID)", () => {
    const decoder = new UrFountainDecoder();
    decoder.receivePartUr(buildBtcSignRequestUR(BASE_PARAMS).toLowerCase());
    const hex = [...decoder.resultUr.getPayloadCbor()]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    expect(hex).toContain("d825"); // tag(37)
  });

  it("uses 'qrkit' as default origin", () => {
    const { map } = decodeSignRequestUR(buildBtcSignRequestUR(BASE_PARAMS));
    expect(map.get(6)).toBe("qrkit");
  });

  it("accepts a custom origin string", () => {
    const { map } = decodeSignRequestUR(
      buildBtcSignRequestUR({ ...BASE_PARAMS, origin: "my-dapp" }),
    );
    expect(map.get(6)).toBe("my-dapp");
  });
});

describe("buildBtcSignRequestURParts", () => {
  it("splits a long message into multiple animated UR parts", () => {
    const parts = buildBtcSignRequestURParts({
      ...BASE_PARAMS,
      signData: "Hello qrkit ".repeat(80),
    });
    expect(parts.length).toBeGreaterThan(1);
  });

  it("animated parts reassemble into a valid btc-sign-request", () => {
    const parts = buildBtcSignRequestURParts({
      ...BASE_PARAMS,
      signData: "Hello qrkit ".repeat(80),
    });
    const decoder = new UrFountainDecoder();
    for (const part of parts) {
      decoder.receivePartUr(part.toLowerCase());
    }
    expect(decoder.isComplete()).toBe(true);
    expect(decoder.resultUr.type).toBe("btc-sign-request");
  });
});
