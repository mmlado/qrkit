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
// parseConnection returns Account objects holding the account-level xpub.
// chains: ["evm"] means BTC accounts are excluded even if the wallet exports them.
// Use chains: ["evm", "btc"] for a multi-chain dApp.
//
// scannedUR is plain data — store it once and derive any address later without
// re-scanning the QR code.

const accounts = parseConnection(scannedUR, { chains: ["evm"] });
const account = accounts.find((a): a is EvmAccount => a.chain === "evm");

if (!account) throw new Error("No EVM account found in scanned QR");

console.log("\n── EVM Account ───────────────────────────────────────────────");
console.log("Account path:        ", account.derivationPath);
console.log("xpub:                ", account.xpub.slice(0, 20) + "...");
console.log("Source fingerprint:  ", "0x" + account.sourceFingerprint?.toString(16));

// ── Step 3: Derive addresses ──────────────────────────────────────────────────
//
// Call deriveAddress(index) on the account to get any address.
// No re-scan needed -- the xpub is already in memory.

const evmAccount = account;
const address0 = evmAccount.deriveAddress(0);
const address1 = evmAccount.deriveAddress(1);
const address5 = evmAccount.deriveAddress(5);

console.log("\n── Derived Addresses (same xpub, no re-scan) ─────────────────");
console.log("Index 0 address:     ", address0.address);
console.log("Index 0 path:        ", address0.derivationPath);
console.log("Index 1 address:     ", address1.address);
console.log("Index 1 path:        ", address1.derivationPath);
console.log("Index 5 address:     ", address5.address);
console.log("Index 5 path:        ", address5.derivationPath);

// ── Step 4: Build sign request ────────────────────────────────────────────────

const message = "Hello from qrkit!";
const parts = buildEthSignRequestURParts({
  signData: message,
  address: address0.address,
  sourceFingerprint: account.sourceFingerprint,
  origin: "qrkit-example",
});

console.log("\n── Sign Request ──────────────────────────────────────────────");
console.log("Message:             ", message);
console.log("QR parts:            ", parts.length);
console.log("Part 0 (display as QR):");
console.log(" ", parts[0]);

// ── Step 5: Parse signature response ─────────────────────────────────────────
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
