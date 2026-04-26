/**
 * Example: BTC connection and direct message-signing flow using @qrkit/core
 *
 * Run with:
 *   pnpm --filter @qrkit/core example:btc-message
 *
 * This script simulates what a dApp would do:
 *   1. Parse a crypto-multi-accounts connection QR
 *   2. Select a BTC account
 *   3. Build a btc-sign-request UR to display as a QR code
 *   4. Parse a simulated btc-signature response
 */

import { HDKey } from "@scure/bip32";

import {
  buildBtcSignRequestURParts,
  parseBtcSignature,
  parseConnection,
} from "../src/index.js";
import { CborTag, encode } from "../src/cbor.js";
import type { BtcAccount } from "../src/index.js";

const SEED = new Uint8Array(32).fill(1);
const SOURCE_FINGERPRINT = 0x01020304;

function accountKey(path: string): HDKey {
  return HDKey.fromMasterSeed(SEED).derive(path);
}

function hdkeyMap(path: string, purpose: number): Map<number, unknown> {
  const key = accountKey(path);
  if (!key.publicKey) throw new Error(`Missing public key for ${path}`);

  const origin = new Map<number, unknown>([
    [1, [purpose, true, 0, true, 0, true]],
    [2, SOURCE_FINGERPRINT],
  ]);

  return new Map<number, unknown>([
    [3, key.publicKey],
    [4, key.chainCode],
    [6, new CborTag(304, origin)],
    [9, "Example BTC wallet"],
  ]);
}

const scannedUR = {
  type: "crypto-multi-accounts",
  cbor: encode(
    new Map<number, unknown>([
      [
        2,
        [
          new CborTag(303, hdkeyMap("m/84'/0'/0'", 84)),
          new CborTag(303, hdkeyMap("m/49'/0'/0'", 49)),
          new CborTag(303, hdkeyMap("m/44'/0'/0'", 44)),
        ],
      ],
      [3, "Example BTC wallet"],
    ]),
  ),
};

console.log("── Connection QR ─────────────────────────────────────────────");
console.log("UR type:", scannedUR.type);

const accounts = parseConnection(scannedUR, { chains: ["btc"] });
const account = accounts.find(
  (candidate): candidate is BtcAccount =>
    candidate.chain === "btc" && candidate.scriptType === "p2wpkh",
);

if (!account) {
  throw new Error("No native SegWit BTC account found in scanned QR");
}

const derived = account.deriveAddress(0);

console.log("\n── BTC Account ───────────────────────────────────────────────");
console.log("Account path:        ", account.derivationPath);
console.log("Address:             ", derived.address);
console.log("Script type:         ", derived.scriptType);
console.log("Public key:          ", derived.publicKey);
console.log("Source fingerprint:  ", `0x${account.sourceFingerprint?.toString(16)}`);

const message = "Hello from qrkit BTC!";
const parts = buildBtcSignRequestURParts({
  signData: message,
  address: derived.address,
  scriptType: derived.scriptType,
  sourceFingerprint: account.sourceFingerprint,
  origin: "qrkit-example",
});

console.log("\n── BTC Sign Request ──────────────────────────────────────────");
console.log("Message:             ", message);
console.log("QR parts:            ", parts.length);
console.log("Part 0 (display as QR):");
console.log(" ", parts[0]);

// In a real flow the user scans the wallet's btc-signature QR here.
// We simulate a valid-shaped response to show the parse path.
const fakeSignatureBytes = new Uint8Array(65);
fakeSignatureBytes[0] = 31; // compact Bitcoin message signature header
crypto.getRandomValues(fakeSignatureBytes.subarray(1));

const fakePublicKey = new Uint8Array(
  derived.publicKey.match(/.{2}/g)?.map((byte) => parseInt(byte, 16)) ?? [],
);
const fakeCbor = encode(
  new Map<number, unknown>([
    [2, fakeSignatureBytes],
    [3, fakePublicKey],
  ]),
);

const signature = parseBtcSignature({ type: "btc-signature", cbor: fakeCbor });

console.log("\n── BTC Signature Response ────────────────────────────────────");
console.log("Signature (base64):  ", `${signature.signature.slice(0, 20)}...`);
console.log("Public key:          ", signature.publicKey);
console.log("\nDone.");
