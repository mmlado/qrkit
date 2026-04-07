/**
 * Example: full EVM connection and sign-message flow using @qrkit/core
 *
 * Run with:
 *   pnpm --filter @qrkit/core example
 *
 * This script simulates what a dApp would do:
 *   1. Parse a connection QR exported from a hardware wallet (crypto-hdkey)
 *   2. Derive the EVM account via parseConnection with chains: ["evm"]
 *   3. Build an eth-sign-request UR to display as a QR code
 *   4. Parse a simulated eth-signature response
 */

import { UrFountainDecoder } from "@qrkit/bc-ur-web";
import {
  parseConnection,
  buildEthSignRequestURParts,
  parseEthSignature,
} from "../src/index.js";
import type { EvmAccount } from "../src/index.js";

// ── Step 1: Parse connection QR ───────────────────────────────────────────────
//
// In a real app this comes from a camera scan. Here we use a UR captured
// from a real Shell device (m/44'/60'/0').

const ETH_HDKEY_UR =
  "ur:crypto-hdkey/osaowkaxhdclaojyhdtidmwprpltktftfefxmymottrfndlbiofwehbdgsbwgeglkstsembgkklfgsaahdcxghnbrsbzylkeiyuecfmwnlbggwhtkownwdeylahgjsykwshecxmhamsfecvtdeyaamtaaddyotadlncsdwykcsfnykaeykaocyiscmcyceaxaxaycylebgmkbzasjngrihkkiahsjpiecxguisihjzjzbkjohsiaiajlkpjtjydmjkjyhsjtiehsjpiefrcntszm";

const decoder = new UrFountainDecoder();
decoder.receivePartUr(ETH_HDKEY_UR);
const scannedUR = {
  type: decoder.resultUr.type,
  cbor: decoder.resultUr.getPayloadCbor(),
};

console.log("── Connection QR ─────────────────────────────────────────────");
console.log("UR type:", scannedUR.type);

// ── Step 2: Parse accounts ────────────────────────────────────────────────────
//
// chains: ["evm"] means BTC accounts are excluded even if the wallet exports them.
// Use chains: ["evm", "btc"] for a multi-chain dApp.

const accounts = parseConnection(scannedUR, { chains: ["evm"] });
const account = accounts.find((a): a is EvmAccount => a.chain === "evm");

if (!account) {
  console.error("No EVM account found in scanned QR");
  process.exit(1);
}

console.log("\n── EVM Account ───────────────────────────────────────────────");
console.log("Address:             ", account.address);
console.log("Public key:          ", account.publicKey);
console.log("Source fingerprint:  ", "0x" + account.sourceFingerprint?.toString(16));

// ── Step 3: Build sign request ────────────────────────────────────────────────

const message = "Hello from qrkit!";
const parts = buildEthSignRequestURParts({
  signData: message,
  address: account.address,
  sourceFingerprint: account.sourceFingerprint,
  origin: "qrkit-example",
});

console.log("\n── Sign Request ──────────────────────────────────────────────");
console.log("Message:             ", message);
console.log("QR parts:            ", parts.length);
console.log("Part 0 (display as QR):");
console.log(" ", parts[0]);

// ── Step 4: Parse signature response ─────────────────────────────────────────
//
// In a real flow the user scans the wallet's eth-signature QR here.
// We simulate a valid-shaped response to show the parse path.

const fakeSignatureBytes = new Uint8Array(65);
fakeSignatureBytes[0] = 27; // recovery header
crypto.getRandomValues(fakeSignatureBytes.subarray(1));

const fakeCbor = new Uint8Array([
  0xa1, 0x02, 0x58, 0x41,
  ...fakeSignatureBytes,
]);

const signature = parseEthSignature({ type: "eth-signature", cbor: fakeCbor });

console.log("\n── Signature Response ────────────────────────────────────────");
console.log("Signature (0x...):   ", signature.slice(0, 20) + "...");
console.log("Length (bytes):      ", (signature.length - 2) / 2);
console.log("\nDone.");
