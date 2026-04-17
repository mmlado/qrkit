import { describe, it, expect } from "vitest";

import { parseXpub } from "../../parseXpub.js";
import { deriveEvmAccount } from "../../eth/deriveAccount.js";
import {
  ETH_HDKEY_UR,
  ETH_ADDRESS,
  SOURCE_FINGERPRINT,
  DEVICE_NAME,
  urToCbor,
} from "../fixtures.js";

describe("deriveEvmAccount", () => {
  it("derives the correct EVM address from a real Shell device key", () => {
    const parsed = parseXpub({ type: "crypto-hdkey", cbor: urToCbor(ETH_HDKEY_UR) });
    const [account] = deriveEvmAccount(parsed);
    expect(account?.address).toBe(ETH_ADDRESS);
  });

  it("carries source-fingerprint through", () => {
    const parsed = parseXpub({ type: "crypto-hdkey", cbor: urToCbor(ETH_HDKEY_UR) });
    const [account] = deriveEvmAccount(parsed);
    expect(account?.sourceFingerprint).toBe(SOURCE_FINGERPRINT);
  });

  it("exposes the compressed public key as a hex string", () => {
    const parsed = parseXpub({ type: "crypto-hdkey", cbor: urToCbor(ETH_HDKEY_UR) });
    const [account] = deriveEvmAccount(parsed);
    expect(account?.publicKey).toMatch(/^[0-9a-f]{66}$/); // 33 bytes = 66 hex chars
  });

  it("returns an empty array for an empty input", () => {
    expect(deriveEvmAccount([])).toEqual([]);
  });

  it("carries the device name through from the parsed xpub", () => {
    const parsed = parseXpub({ type: "crypto-hdkey", cbor: urToCbor(ETH_HDKEY_UR) });
    const [account] = deriveEvmAccount(parsed);
    expect(account?.device).toBe(DEVICE_NAME);
  });

  it("includes the BIP-44 derivation path", () => {
    const parsed = parseXpub({ type: "crypto-hdkey", cbor: urToCbor(ETH_HDKEY_UR) });
    const [account] = deriveEvmAccount(parsed);
    expect(account?.derivationPath).toMatch(/^m\/\d+'\/\d+'\/0'\/0\/0$/);
  });
});
