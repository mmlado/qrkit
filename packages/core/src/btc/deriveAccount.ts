import type { HDKey } from "@scure/bip32";

import { bytesToHex } from "../bytes.js";
import {
  pubKeyToP2pkh,
  pubKeyToP2shP2wpkh,
  pubKeyToP2wpkh,
  type BtcScriptType,
} from "./address.js";
import type { ParsedXpub } from "../parseXpub.js";

export interface DerivedBtcAccount {
  address: string;
  scriptType: BtcScriptType;
  publicKey: string;
  /** source-fingerprint from the scanned xpub — required for signing */
  sourceFingerprint: number | undefined;
  /** device or key name as reported by the hardware wallet, if available */
  device: string | undefined;
}

// Derive the first external address (index 0) from an account-level xpub.
// Account-level xpub is at depth 3 (m/purpose'/coin'/account').
// External chain is child 0, then address index 0.
function firstChild(accountKey: HDKey): HDKey {
  return accountKey.deriveChild(0).deriveChild(0);
}

function scriptTypeFromPurpose(purpose: number | undefined): BtcScriptType | undefined {
  if (purpose === 84) return "p2wpkh";
  if (purpose === 49) return "p2sh-p2wpkh";
  if (purpose === 44) return "p2pkh";
  return undefined;
}

function deriveAddress(pubKey: Uint8Array, scriptType: BtcScriptType): string {
  if (scriptType === "p2wpkh") return pubKeyToP2wpkh(pubKey);
  if (scriptType === "p2sh-p2wpkh") return pubKeyToP2shP2wpkh(pubKey);
  return pubKeyToP2pkh(pubKey);
}

export function deriveBtcAccount(parsed: ParsedXpub[]): DerivedBtcAccount[] {
  const results: DerivedBtcAccount[] = [];

  for (const entry of parsed) {
    const { hdKey, purpose, coinType, sourceFingerprint, name } = entry;

    // BTC: coin type 0
    if (coinType !== 0) continue;

    const scriptType = scriptTypeFromPurpose(purpose);
    if (!scriptType) continue;

    const child = firstChild(hdKey);
    if (!child.publicKey) continue;

    results.push({
      address: deriveAddress(child.publicKey, scriptType),
      scriptType,
      publicKey: bytesToHex(child.publicKey),
      sourceFingerprint,
      device: name,
    });
  }

  return results;
}
