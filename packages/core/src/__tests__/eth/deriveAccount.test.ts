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
    expect(account?.deriveAddress(0).address).toBe(ETH_ADDRESS);
  });

  it("carries source-fingerprint through", () => {
    const parsed = parseXpub({ type: "crypto-hdkey", cbor: urToCbor(ETH_HDKEY_UR) });
    const [account] = deriveEvmAccount(parsed);
    expect(account?.sourceFingerprint).toBe(SOURCE_FINGERPRINT);
  });

  it("exposes the compressed public key as a hex string via deriveAddress", () => {
    const parsed = parseXpub({ type: "crypto-hdkey", cbor: urToCbor(ETH_HDKEY_UR) });
    const [account] = deriveEvmAccount(parsed);
    expect(account?.deriveAddress(0).publicKey).toMatch(/^[0-9a-f]{66}$/);
  });

  it("returns an empty array for an empty input", () => {
    expect(deriveEvmAccount([])).toEqual([]);
  });

  it("carries the device name through from the parsed xpub", () => {
    const parsed = parseXpub({ type: "crypto-hdkey", cbor: urToCbor(ETH_HDKEY_UR) });
    const [account] = deriveEvmAccount(parsed);
    expect(account?.device).toBe(DEVICE_NAME);
  });

  it("exposes the account-level derivation path", () => {
    const parsed = parseXpub({ type: "crypto-hdkey", cbor: urToCbor(ETH_HDKEY_UR) });
    const [account] = deriveEvmAccount(parsed);
    expect(account?.derivationPath).toMatch(/^m\/\d+'\/\d+'\/0'$/);
  });

  it("deriveAddress includes the address-level path", () => {
    const parsed = parseXpub({ type: "crypto-hdkey", cbor: urToCbor(ETH_HDKEY_UR) });
    const [account] = deriveEvmAccount(parsed);
    expect(account?.deriveAddress(0).derivationPath).toMatch(/^m\/\d+'\/\d+'\/0'\/0\/0$/);
    expect(account?.deriveAddress(1).derivationPath).toMatch(/^m\/\d+'\/\d+'\/0'\/0\/1$/);
  });

  it("deriveAddress produces different addresses for different indexes", () => {
    const parsed = parseXpub({ type: "crypto-hdkey", cbor: urToCbor(ETH_HDKEY_UR) });
    const [account] = deriveEvmAccount(parsed);
    expect(account?.deriveAddress(0).address).not.toBe(account?.deriveAddress(1).address);
  });
});
