import type { HDKey } from "@scure/bip32";

import {
  pubKeyToP2pkh,
  pubKeyToP2shP2wpkh,
  pubKeyToP2wpkh,
  type BtcScriptType,
} from "./address.js";

import { bytesToHex } from "../bytes.js";
import type { ParsedXpub } from "../parseXpub.js";
import type { BtcAccount, BtcDerivedAddress } from "../types.js";

function deriveChild(accountKey: HDKey, addressIndex: number): HDKey {
  return accountKey.deriveChild(0).deriveChild(addressIndex);
}

function scriptTypeFromPurpose(purpose: number | undefined): BtcScriptType | undefined {
  if (purpose === 84) return "p2wpkh";
  if (purpose === 49) return "p2sh-p2wpkh";
  if (purpose === 44) return "p2pkh";
  return undefined;
}

function deriveAddressFn(pubKey: Uint8Array, scriptType: BtcScriptType): string {
  if (scriptType === "p2wpkh") return pubKeyToP2wpkh(pubKey);
  if (scriptType === "p2sh-p2wpkh") return pubKeyToP2shP2wpkh(pubKey);
  return pubKeyToP2pkh(pubKey);
}

function buildDerived(
  hdKey: HDKey,
  purpose: number,
  coinType: number,
  accountIndex: number,
  scriptType: BtcScriptType,
  sourceFingerprint: number | undefined,
  device: string | undefined,
  addressIndex: number,
): BtcDerivedAddress {
  const child = deriveChild(hdKey, addressIndex);
  if (!child.publicKey) throw new Error("Failed to derive child public key");
  return {
    chain: "btc",
    address: deriveAddressFn(child.publicKey, scriptType),
    scriptType,
    publicKey: bytesToHex(child.publicKey),
    derivationPath: `m/${purpose}'/${coinType}'/${accountIndex}'/0/${addressIndex}`,
    sourceFingerprint,
    device,
  };
}

export function deriveBtcAccount(parsed: ParsedXpub[]): BtcAccount[] {
  const results: BtcAccount[] = [];

  for (const entry of parsed) {
    const { hdKey, purpose, coinType, accountIndex, sourceFingerprint, name } = entry;

    if (coinType !== 0) continue;

    const scriptType = scriptTypeFromPurpose(purpose);
    if (!scriptType) continue;

    const p = purpose as number;
    const c = coinType;
    const a = accountIndex ?? 0;

    results.push({
      chain: "btc",
      xpub: hdKey.publicExtendedKey,
      scriptType,
      derivationPath: `m/${p}'/${c}'/${a}'`,
      sourceFingerprint,
      device: name,
      deriveAddress: (addressIndex: number) =>
        buildDerived(hdKey, p, c, a, scriptType, sourceFingerprint, name, addressIndex),
    });
  }

  return results;
}
