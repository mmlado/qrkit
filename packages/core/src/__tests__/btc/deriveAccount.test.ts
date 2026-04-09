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

    expect(accounts).toEqual([
      expect.objectContaining({
        address: BTC_NATIVE_SEGWIT_ADDRESS,
        scriptType: "p2wpkh",
      }),
      expect.objectContaining({
        address: BTC_NESTED_SEGWIT_ADDRESS,
        scriptType: "p2sh-p2wpkh",
      }),
      expect.objectContaining({
        address: BTC_LEGACY_ADDRESS,
        scriptType: "p2pkh",
      }),
    ]);
  });

  it("carries source fingerprint, device name, and public key through", () => {
    const parsed = parseXpub({ type: "crypto-multi-accounts", cbor: multiAccountCbor() });
    const [account] = deriveBtcAccount(parsed);

    expect(account?.sourceFingerprint).toBe(MULTI_ACCOUNT_SOURCE_FINGERPRINT);
    expect(account?.device).toBe(MULTI_ACCOUNT_DEVICE_NAME);
    expect(account?.publicKey).toMatch(/^[0-9a-f]{66}$/);
  });

  it("returns an empty array for EVM-only inputs", () => {
    const parsed = parseXpub({
      type: "crypto-multi-accounts",
      cbor: multiAccountCbor(),
    }).filter((entry) => entry.coinType === 60);
    expect(deriveBtcAccount(parsed)).toEqual([]);
  });
});
