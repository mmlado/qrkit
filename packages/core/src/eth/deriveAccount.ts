import type { HDKey } from "@scure/bip32";

import { bytesToHex } from "../bytes.js";
import { pubKeyToEthAddress } from "./address.js";
import type { ParsedXpub } from "../parseXpub.js";

export interface DerivedAccount {
  address: string;
  publicKey: string;
  /** source-fingerprint from the scanned xpub — required by Shell for signing */
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

export function deriveEvmAccount(parsed: ParsedXpub[]): DerivedAccount[] {
  const results: DerivedAccount[] = [];
  for (const entry of parsed) {
    const { hdKey, purpose, coinType, type, sourceFingerprint, name } = entry;
    const isEvm =
      (purpose === 44 && coinType === 60) || (purpose === undefined && type === "xpub");

    if (!isEvm) continue;

    const child = firstChild(hdKey);
    if (!child.publicKey) continue;

    results.push({
      address: pubKeyToEthAddress(child.publicKey),
      publicKey: bytesToHex(child.publicKey),
      sourceFingerprint,
      device: name,
    });
  }
  return results;
}
