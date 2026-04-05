import { describe, it, expect } from "vitest";
import { decode, type TagDecoder } from "cborg";
import { UrFountainDecoder } from "@qrkit/bc-ur";

import {
  buildEthSignRequestUR,
  buildEthSignRequestURParts,
} from "../../eth/signRequest.js";
import { ETH_ADDRESS, SOURCE_FINGERPRINT } from "../fixtures.js";

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

describe("buildEthSignRequestUR", () => {
  it("produces a valid ur:eth-sign-request", () => {
    const ur = buildEthSignRequestUR("Hello", ETH_ADDRESS, SOURCE_FINGERPRINT);
    expect(ur.toLowerCase()).toMatch(/^ur:eth-sign-request\//);
  });

  it("sets data-type to 3 (eth-raw-bytes / EIP-191)", () => {
    const { map } = decodeSignRequestUR(
      buildEthSignRequestUR("Hello", ETH_ADDRESS, SOURCE_FINGERPRINT),
    );
    expect(map.get(3)).toBe(3);
  });

  it("encodes the message as UTF-8 bytes", () => {
    const message = "Hello qrkit";
    const { map } = decodeSignRequestUR(
      buildEthSignRequestUR(message, ETH_ADDRESS, SOURCE_FINGERPRINT),
    );
    expect(new TextDecoder().decode(map.get(2) as Uint8Array)).toBe(message);
  });

  it("includes derivation path m/44'/60'/0'/0/0", () => {
    const { map } = decodeSignRequestUR(
      buildEthSignRequestUR("Hello", ETH_ADDRESS, SOURCE_FINGERPRINT),
    );
    const keypath = map.get(5) as Map<number, unknown>;
    expect(keypath.get(1)).toEqual([44, true, 60, true, 0, true, 0, false, 0, false]);
  });

  it("includes source-fingerprint in the keypath", () => {
    const { map } = decodeSignRequestUR(
      buildEthSignRequestUR("Hello", ETH_ADDRESS, SOURCE_FINGERPRINT),
    );
    const keypath = map.get(5) as Map<number, unknown>;
    expect(keypath.get(2)).toBe(SOURCE_FINGERPRINT);
  });

  it("encodes address as 20 raw bytes matching the input address", () => {
    const { map } = decodeSignRequestUR(
      buildEthSignRequestUR("Hello", ETH_ADDRESS, SOURCE_FINGERPRINT),
    );
    const addrBytes = map.get(6) as Uint8Array;
    expect(addrBytes).toHaveLength(20);
    const hex =
      "0x" + [...addrBytes].map((b) => b.toString(16).padStart(2, "0")).join("");
    expect(hex.toLowerCase()).toBe(ETH_ADDRESS.toLowerCase());
  });

  it("wraps request-id in CBOR tag 37 (UUID)", () => {
    const decoder = new UrFountainDecoder();
    const ur = buildEthSignRequestUR("Hello", ETH_ADDRESS, SOURCE_FINGERPRINT);
    decoder.receivePartUr(ur.toLowerCase());
    const hex = [...decoder.resultUr.getPayloadCbor()]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    expect(hex).toContain("d825"); // tag(37)
  });

  it("uses 'qrkit' as default origin", () => {
    const { map } = decodeSignRequestUR(
      buildEthSignRequestUR("Hello", ETH_ADDRESS, SOURCE_FINGERPRINT),
    );
    expect(map.get(7)).toBe("qrkit");
  });

  it("accepts a custom origin string", () => {
    const { map } = decodeSignRequestUR(
      buildEthSignRequestUR("Hello", ETH_ADDRESS, SOURCE_FINGERPRINT, "my-dapp"),
    );
    expect(map.get(7)).toBe("my-dapp");
  });
});

describe("buildEthSignRequestURParts", () => {
  it("splits a long message into multiple animated UR parts", () => {
    const parts = buildEthSignRequestURParts(
      "Hello qrkit ".repeat(80),
      ETH_ADDRESS,
      SOURCE_FINGERPRINT,
    );
    expect(parts.length).toBeGreaterThan(1);
  });

  it("animated parts reassemble into a valid eth-sign-request", () => {
    const parts = buildEthSignRequestURParts(
      "Hello qrkit ".repeat(80),
      ETH_ADDRESS,
      SOURCE_FINGERPRINT,
    );
    const decoder = new UrFountainDecoder();
    for (const part of parts) {
      decoder.receivePartUr(part.toLowerCase());
    }
    expect(decoder.isComplete()).toBe(true);
    expect(decoder.resultUr.type).toBe("eth-sign-request");
  });
});
