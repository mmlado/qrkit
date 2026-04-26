import { describe, expect, it } from "vitest";

import { deriveBtcAccount } from "../../btc/deriveAccount.js";
import { parseXpub } from "../../parseXpub.js";
import {
  BTC_LEGACY_ADDRESS,
  BTC_NATIVE_SEGWIT_ADDRESS,
  BTC_NESTED_SEGWIT_ADDRESS,
  MULTI_ACCOUNT_DEVICE_NAME,
  MULTI_ACCOUNT_SOURCE_FINGERPRINT,
  multiAccountCbor,
} from "../fixtures.js";

describe("deriveBtcAccount", () => {
  it("derives all supported BTC account types from a multi-account export", () => {
    const parsed = parseXpub({ type: "crypto-multi-accounts", cbor: multiAccountCbor() });
    const accounts = deriveBtcAccount(parsed);

    expect(accounts[0].scriptType).toBe("p2wpkh");
    expect(accounts[0].deriveAddress(0).address).toBe(BTC_NATIVE_SEGWIT_ADDRESS);

    expect(accounts[1].scriptType).toBe("p2sh-p2wpkh");
    expect(accounts[1].deriveAddress(0).address).toBe(BTC_NESTED_SEGWIT_ADDRESS);

    expect(accounts[2].scriptType).toBe("p2pkh");
    expect(accounts[2].deriveAddress(0).address).toBe(BTC_LEGACY_ADDRESS);
  });

  it("carries source fingerprint and device name through", () => {
    const parsed = parseXpub({ type: "crypto-multi-accounts", cbor: multiAccountCbor() });
    const [account] = deriveBtcAccount(parsed);

    expect(account?.sourceFingerprint).toBe(MULTI_ACCOUNT_SOURCE_FINGERPRINT);
    expect(account?.device).toBe(MULTI_ACCOUNT_DEVICE_NAME);
  });

  it("exposes the compressed public key via deriveAddress", () => {
    const parsed = parseXpub({ type: "crypto-multi-accounts", cbor: multiAccountCbor() });
    const [account] = deriveBtcAccount(parsed);
    expect(account?.deriveAddress(0).publicKey).toMatch(/^[0-9a-f]{66}$/);
  });

  it("deriveAddress produces different addresses for different indexes", () => {
    const parsed = parseXpub({ type: "crypto-multi-accounts", cbor: multiAccountCbor() });
    const [account] = deriveBtcAccount(parsed);
    expect(account?.deriveAddress(0).address).not.toBe(account?.deriveAddress(1).address);
  });

  it("returns an empty array for EVM-only inputs", () => {
    const parsed = parseXpub({
      type: "crypto-multi-accounts",
      cbor: multiAccountCbor(),
    }).filter((entry) => entry.coinType === 60);
    expect(deriveBtcAccount(parsed)).toEqual([]);
  });
});
