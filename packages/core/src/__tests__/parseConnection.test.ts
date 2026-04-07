import { describe, it, expect } from "vitest";

import { parseConnection } from "../parseConnection.js";
import {
  ETH_HDKEY_UR,
  ETH_ADDRESS,
  SOURCE_FINGERPRINT,
  DEVICE_NAME,
  urToCbor,
} from "./fixtures.js";

const scannedUR = { type: "crypto-hdkey", cbor: urToCbor(ETH_HDKEY_UR) };

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
  it("returns no accounts (BTC not yet implemented)", () => {
    const accounts = parseConnection(scannedUR, { chains: ["btc"] });
    expect(accounts).toHaveLength(0);
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
  it("returns the EVM account and skips missing BTC", () => {
    const accounts = parseConnection(scannedUR, { chains: ["evm", "btc"] });
    expect(accounts).toHaveLength(1);
    expect(accounts[0].chain).toBe("evm");
  });
});
