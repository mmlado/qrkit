import { describe, expect, it } from "vitest";

import { pubKeyToP2pkh, pubKeyToP2shP2wpkh, pubKeyToP2wpkh } from "../../btc/address.js";

const GENERATOR_PUBLIC_KEY = Uint8Array.from([
  0x02, 0x79, 0xbe, 0x66, 0x7e, 0xf9, 0xdc, 0xbb, 0xac, 0x55, 0xa0, 0x62, 0x95, 0xce,
  0x87, 0x0b, 0x07, 0x02, 0x9b, 0xfc, 0xdb, 0x2d, 0xce, 0x28, 0xd9, 0x59, 0xf2, 0x81,
  0x5b, 0x16, 0xf8, 0x17, 0x98,
]);

describe("BTC address derivation", () => {
  it("derives native SegWit P2WPKH addresses", () => {
    expect(pubKeyToP2wpkh(GENERATOR_PUBLIC_KEY)).toBe(
      "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
    );
  });

  it("derives nested SegWit P2SH-P2WPKH addresses", () => {
    expect(pubKeyToP2shP2wpkh(GENERATOR_PUBLIC_KEY)).toBe(
      "3JvL6Ymt8MVWiCNHC7oWU6nLeHNJKLZGLN",
    );
  });

  it("derives legacy P2PKH addresses", () => {
    expect(pubKeyToP2pkh(GENERATOR_PUBLIC_KEY)).toBe(
      "1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH",
    );
  });
});
