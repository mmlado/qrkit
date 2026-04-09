import { describe, it, expect } from "vitest";

import { parseConnection } from "../parseConnection.js";
import {
  ETH_HDKEY_UR,
  ETH_ADDRESS,
  SOURCE_FINGERPRINT,
  DEVICE_NAME,
  BTC_LEGACY_ADDRESS,
  BTC_NATIVE_SEGWIT_ADDRESS,
  BTC_NESTED_SEGWIT_ADDRESS,
  MULTI_ACCOUNT_DEVICE_NAME,
  MULTI_ACCOUNT_ETH_ADDRESS,
  cryptoAccountCbor,
  multiAccountCbor,
  registryStyleMultiAccountCbor,
  urToCbor,
} from "./fixtures.js";

const scannedUR = { type: "crypto-hdkey", cbor: urToCbor(ETH_HDKEY_UR) };
const scannedMultiAccountUR = { type: "crypto-multi-accounts", cbor: multiAccountCbor() };

describe("parseConnection — chains: ['evm']", () => {
  it("returns an EVM account", () => {
    const accounts = parseConnection(scannedUR, { chains: ["evm"] });
    expect(accounts).toHaveLength(1);
    expect(accounts[0].chain).toBe("evm");
  });

  it("returns the correct address", () => {
    const [account] = parseConnection(scannedUR, { chains: ["evm"] });
    expect(account.address).toBe(ETH_ADDRESS);
  });

  it("carries source-fingerprint through", () => {
    const [account] = parseConnection(scannedUR, { chains: ["evm"] });
    expect(account.sourceFingerprint).toBe(SOURCE_FINGERPRINT);
  });

  it("carries the device name through to the returned account", () => {
    const [account] = parseConnection(scannedUR, { chains: ["evm"] });
    expect(account.device).toBe(DEVICE_NAME);
  });
});

describe("parseConnection — chains: ['btc']", () => {
  it("returns BTC accounts from a multi-account export", () => {
    const accounts = parseConnection(scannedMultiAccountUR, { chains: ["btc"] });
    expect(accounts).toEqual([
      expect.objectContaining({
        chain: "btc",
        scriptType: "p2wpkh",
        address: BTC_NATIVE_SEGWIT_ADDRESS,
        device: MULTI_ACCOUNT_DEVICE_NAME,
      }),
      expect.objectContaining({
        chain: "btc",
        scriptType: "p2sh-p2wpkh",
        address: BTC_NESTED_SEGWIT_ADDRESS,
        device: MULTI_ACCOUNT_DEVICE_NAME,
      }),
      expect.objectContaining({
        chain: "btc",
        scriptType: "p2pkh",
        address: BTC_LEGACY_ADDRESS,
        device: "Legacy BTC Key",
      }),
    ]);
  });

  it("skips EVM-only exports", () => {
    const accounts = parseConnection(scannedUR, { chains: ["btc"] });
    expect(accounts).toEqual([]);
  });

  it("returns BTC accounts from a crypto-account export with script-expression tags", () => {
    const accounts = parseConnection(
      { type: "crypto-account", cbor: cryptoAccountCbor() },
      { chains: ["btc"] },
    );
    expect(accounts).toEqual([
      expect.objectContaining({
        chain: "btc",
        scriptType: "p2wpkh",
        address: BTC_NATIVE_SEGWIT_ADDRESS,
        device: "GapSign",
      }),
      expect.objectContaining({
        chain: "btc",
        scriptType: "p2sh-p2wpkh",
        address: BTC_NESTED_SEGWIT_ADDRESS,
        device: "GapSign",
      }),
      expect.objectContaining({
        chain: "btc",
        scriptType: "p2pkh",
        address: BTC_LEGACY_ADDRESS,
        device: "GapSign",
      }),
    ]);
  });
});

describe("parseConnection — no chains config", () => {
  it("tries all chains when chains is omitted", () => {
    const accounts = parseConnection(scannedUR, {});
    expect(accounts[0].chain).toBe("evm");
  });

  it("config defaults to empty object (no argument)", () => {
    const accounts = parseConnection(scannedUR);
    expect(accounts[0].chain).toBe("evm");
  });
});

describe("parseConnection — chains: ['evm', 'btc']", () => {
  it("returns the EVM account and skips missing BTC for EVM-only exports", () => {
    const accounts = parseConnection(scannedUR, { chains: ["evm", "btc"] });
    expect(accounts).toHaveLength(1);
    expect(accounts[0].chain).toBe("evm");
  });

  it("returns all EVM and BTC accounts from a multi-account export", () => {
    const accounts = parseConnection(scannedMultiAccountUR, { chains: ["evm", "btc"] });
    expect(accounts).toHaveLength(4);
    expect(accounts.map((account) => account.chain)).toEqual([
      "evm",
      "btc",
      "btc",
      "btc",
    ]);
    expect(accounts[0].address).toBe(MULTI_ACCOUNT_ETH_ADDRESS);
    expect(accounts.slice(1).map((account) => account.address)).toEqual([
      BTC_NATIVE_SEGWIT_ADDRESS,
      BTC_NESTED_SEGWIT_ADDRESS,
      BTC_LEGACY_ADDRESS,
    ]);
  });

  it("accepts registry-style multi-account exports with Buffer maps", () => {
    const accounts = parseConnection(
      { type: "crypto-multi-accounts", cbor: registryStyleMultiAccountCbor() },
      { chains: ["evm", "btc"] },
    );
    expect(accounts).toHaveLength(4);
    expect(accounts[0].address).toBe(MULTI_ACCOUNT_ETH_ADDRESS);
    expect(accounts.map((account) => account.device)).toEqual([
      "GapSign",
      "GapSign",
      "GapSign",
      "GapSign",
    ]);
    expect(accounts.slice(1).map((account) => account.address)).toEqual([
      BTC_NATIVE_SEGWIT_ADDRESS,
      BTC_NESTED_SEGWIT_ADDRESS,
      BTC_LEGACY_ADDRESS,
    ]);
  });
});
