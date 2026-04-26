import { describe, it, expect } from "vitest";

import type { BtcAccount } from "../types.js";
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

function expectBtcAccount(account: unknown): asserts account is BtcAccount {
  expect(account).toMatchObject({ chain: "btc" });
}

describe("parseConnection — chains: ['evm']", () => {
  it("returns an EVM account", () => {
    const accounts = parseConnection(scannedUR, { chains: ["evm"] });
    expect(accounts).toHaveLength(1);
    expect(accounts[0].chain).toBe("evm");
  });

  it("returns the correct address via deriveAddress(0)", () => {
    const [account] = parseConnection(scannedUR, { chains: ["evm"] });
    expect(account.deriveAddress(0).address).toBe(ETH_ADDRESS);
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
    expect(accounts).toHaveLength(3);
    expectBtcAccount(accounts[0]);
    expectBtcAccount(accounts[1]);
    expectBtcAccount(accounts[2]);
    expect(accounts[0].scriptType).toBe("p2wpkh");
    expect(accounts[0].deriveAddress(0).address).toBe(BTC_NATIVE_SEGWIT_ADDRESS);
    expect(accounts[0].device).toBe(MULTI_ACCOUNT_DEVICE_NAME);

    expect(accounts[1].scriptType).toBe("p2sh-p2wpkh");
    expect(accounts[1].deriveAddress(0).address).toBe(BTC_NESTED_SEGWIT_ADDRESS);
    expect(accounts[1].device).toBe(MULTI_ACCOUNT_DEVICE_NAME);

    expect(accounts[2].scriptType).toBe("p2pkh");
    expect(accounts[2].deriveAddress(0).address).toBe(BTC_LEGACY_ADDRESS);
    expect(accounts[2].device).toBe("Legacy BTC Key");
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
    expect(accounts).toHaveLength(3);
    expectBtcAccount(accounts[0]);
    expectBtcAccount(accounts[1]);
    expectBtcAccount(accounts[2]);
    expect(accounts[0].scriptType).toBe("p2wpkh");
    expect(accounts[0].deriveAddress(0).address).toBe(BTC_NATIVE_SEGWIT_ADDRESS);
    expect(accounts[0].device).toBe("GapSign");

    expect(accounts[1].scriptType).toBe("p2sh-p2wpkh");
    expect(accounts[1].deriveAddress(0).address).toBe(BTC_NESTED_SEGWIT_ADDRESS);

    expect(accounts[2].scriptType).toBe("p2pkh");
    expect(accounts[2].deriveAddress(0).address).toBe(BTC_LEGACY_ADDRESS);
  });
});

describe("parseConnection — deriveAddress", () => {
  it("deriveAddress(0) returns the default address", () => {
    const [account] = parseConnection(scannedUR, { chains: ["evm"] });
    expect(account.deriveAddress(0).address).toBe(ETH_ADDRESS);
    expect(account.deriveAddress(0).derivationPath).toBe("m/44'/60'/0'/0/0");
  });

  it("deriveAddress(1) returns a different address", () => {
    const [account] = parseConnection(scannedUR, { chains: ["evm"] });
    expect(account.deriveAddress(1).address).toBe(
      "0x19869aB36079079b8e902bd76abcAafaA3e61936",
    );
    expect(account.deriveAddress(1).derivationPath).toBe("m/44'/60'/0'/0/1");
  });

  it("deriveAddress produces different addresses for different indexes", () => {
    const [account] = parseConnection(scannedUR, { chains: ["evm"] });
    expect(account.deriveAddress(0).address).not.toBe(account.deriveAddress(1).address);
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
    expect(accounts[0].deriveAddress(0).address).toBe(MULTI_ACCOUNT_ETH_ADDRESS);
    expect(accounts.slice(1).map((account) => account.deriveAddress(0).address)).toEqual([
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
    expect(accounts[0].deriveAddress(0).address).toBe(MULTI_ACCOUNT_ETH_ADDRESS);
    expect(accounts.map((account) => account.device)).toEqual([
      "GapSign",
      "GapSign",
      "GapSign",
      "GapSign",
    ]);
    expect(accounts.slice(1).map((account) => account.deriveAddress(0).address)).toEqual([
      BTC_NATIVE_SEGWIT_ADDRESS,
      BTC_NESTED_SEGWIT_ADDRESS,
      BTC_LEGACY_ADDRESS,
    ]);
  });
});
