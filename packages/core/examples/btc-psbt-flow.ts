/**
 * Example: BTC PSBT transport flow using @qrkit/core
 *
 * Run with:
 *   pnpm --filter @qrkit/core example:btc-psbt
 *
 * This script simulates what a dApp would do for PSBT signing:
 *   1. Build a crypto-psbt UR to display as a QR code
 *   2. Parse a simulated signed crypto-psbt response
 *
 * The wallet signs offline. qrkit only carries PSBT bytes over QR.
 */

import { buildCryptoPsbtURParts, parseCryptoPsbt } from "../src/index.js";
import { encode } from "../src/cbor.js";

// Minimal valid PSBT v0: magic + empty global map + empty unsigned tx.
// Real apps should pass the actual unsigned PSBT bytes or hex.
const unsignedPsbtHex = "70736274ff01000a0200000000000000000000";

const parts = buildCryptoPsbtURParts(unsignedPsbtHex);

console.log("── BTC PSBT Request ──────────────────────────────────────────");
console.log("Unsigned PSBT bytes: ", unsignedPsbtHex.length / 2);
console.log("QR parts:            ", parts.length);
console.log("Part 0 (display as QR):");
console.log(" ", parts[0]);

// In a real flow the user scans the wallet's signed crypto-psbt QR here.
// We simulate that by appending one byte to show the parser path.
const signedPsbt = new Uint8Array([
  ...(unsignedPsbtHex.match(/.{2}/g)?.map((byte) => parseInt(byte, 16)) ?? []),
  0x00,
]);

const parsed = parseCryptoPsbt({
  type: "crypto-psbt",
  cbor: encode(signedPsbt),
});

console.log("\n── BTC PSBT Response ─────────────────────────────────────────");
console.log("Signed PSBT bytes:   ", parsed.psbt.length);
console.log("Signed PSBT hex:     ", `${parsed.psbtHex.slice(0, 40)}...`);
console.log("\nDone.");
