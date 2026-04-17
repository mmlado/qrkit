import type { HDKey } from "@scure/bip32";

import { bytesToHex } from "../bytes.js";
import { pubKeyToEthAddress } from "./address.js";
import type { ParsedXpub } from "../parseXpub.js";

export interface DerivedEvmAccount {
  address: string;
  publicKey: string;
  /** BIP-44 derivation path for the derived address, e.g. "m/44'/60'/0'/0/0" */
  derivationPath: string;
  /** source-fingerprint from the scanned xpub — required by Shell for signing */
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

export function deriveEvmAccount(
  parsed: ParsedXpub[],
  addressIndex = 0,
): DerivedEvmAccount[] {
  const results: DerivedEvmAccount[] = [];
  for (const entry of parsed) {
    const { hdKey, purpose, coinType, accountIndex, type, sourceFingerprint, name } =
      entry;
    const isEvm =
      (purpose === 44 && coinType === 60) || (purpose === undefined && type === "xpub");

    if (!isEvm) continue;

    const child = deriveChild(hdKey, addressIndex);
    if (!child.publicKey) continue;

    const p = purpose ?? 44;
    const c = coinType ?? 60;
    const a = accountIndex ?? 0;
    results.push({
      address: pubKeyToEthAddress(child.publicKey),
      publicKey: bytesToHex(child.publicKey),
      derivationPath: `m/${p}'/${c}'/${a}'/0/${addressIndex}`,
      sourceFingerprint,
      device: name,
    });
  }
  return results;
}
