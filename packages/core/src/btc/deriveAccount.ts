import type { HDKey } from "@scure/bip32";

import {
  pubKeyToP2pkh,
  pubKeyToP2shP2wpkh,
  pubKeyToP2wpkh,
  type BtcScriptType,
} from "./address.js";

import { bytesToHex } from "../bytes.js";
import type { ParsedXpub } from "../parseXpub.js";

export interface DerivedBtcAccount {
  address: string;
  scriptType: BtcScriptType;
  publicKey: string;
  /** BIP-44 derivation path for the derived address, e.g. "m/84'/0'/0'/0/0" */
  derivationPath: string;
  /** source-fingerprint from the scanned xpub — required for signing */
  sourceFingerprint: number | undefined;
  /** device or key name as reported by the hardware wallet, if available */
  device: string | undefined;
}

// Derive an external address from an account-level xpub.
// Account-level xpub is at depth 3 (m/purpose'/coin'/account').
// External chain is child 0, then the given address index.
function deriveChild(accountKey: HDKey, addressIndex: number): HDKey {
  return accountKey.deriveChild(0).deriveChild(addressIndex);
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

export function deriveBtcAccount(
  parsed: ParsedXpub[],
  addressIndex = 0,
): DerivedBtcAccount[] {
  const results: DerivedBtcAccount[] = [];

  for (const entry of parsed) {
    const { hdKey, purpose, coinType, accountIndex, sourceFingerprint, name } = entry;

    // BTC: coin type 0
    if (coinType !== 0) continue;

    const scriptType = scriptTypeFromPurpose(purpose);
    if (!scriptType) continue;

    const child = deriveChild(hdKey, addressIndex);
    if (!child.publicKey) continue;

    const p = purpose;
    const c = coinType;
    const a = accountIndex ?? 0;
    results.push({
      address: deriveAddress(child.publicKey, scriptType),
      scriptType,
      publicKey: bytesToHex(child.publicKey),
      derivationPath: `m/${p}'/${c}'/${a}'/0/${addressIndex}`,
      sourceFingerprint,
      device: name,
    });
  }

  return results;
}
