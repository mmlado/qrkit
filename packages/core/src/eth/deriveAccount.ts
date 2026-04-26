import type { HDKey } from "@scure/bip32";

import { bytesToHex } from "../bytes.js";
import { pubKeyToEthAddress } from "./address.js";
import type { ParsedXpub } from "../parseXpub.js";
import type { EvmAccount, EvmDerivedAddress } from "../types.js";

function deriveChild(accountKey: HDKey, addressIndex: number): HDKey {
  return accountKey.deriveChild(0).deriveChild(addressIndex);
}

function buildDerived(
  hdKey: HDKey,
  purpose: number,
  coinType: number,
  accountIndex: number,
  sourceFingerprint: number | undefined,
  device: string | undefined,
  addressIndex: number,
): EvmDerivedAddress {
  const child = deriveChild(hdKey, addressIndex);
  if (!child.publicKey) throw new Error("Failed to derive child public key");
  return {
    chain: "evm",
    address: pubKeyToEthAddress(child.publicKey),
    publicKey: bytesToHex(child.publicKey),
    derivationPath: `m/${purpose}'/${coinType}'/${accountIndex}'/0/${addressIndex}`,
    sourceFingerprint,
    device,
  };
}

export function deriveEvmAccount(parsed: ParsedXpub[]): EvmAccount[] {
  const results: EvmAccount[] = [];
  for (const entry of parsed) {
    const { hdKey, purpose, coinType, accountIndex, type, sourceFingerprint, name } =
      entry;
    const isEvm =
      (purpose === 44 && coinType === 60) || (purpose === undefined && type === "xpub");

    if (!isEvm) continue;

    const p = purpose ?? 44;
    const c = coinType ?? 60;
    const a = accountIndex ?? 0;

    results.push({
      chain: "evm",
      xpub: hdKey.publicExtendedKey,
      derivationPath: `m/${p}'/${c}'/${a}'`,
      sourceFingerprint,
      device: name,
      deriveAddress: (addressIndex: number) =>
        buildDerived(hdKey, p, c, a, sourceFingerprint, name, addressIndex),
    });
  }
  return results;
}
