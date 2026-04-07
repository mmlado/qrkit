import { HDKey } from "@scure/bip32";
import { decode as cborDecode, type TagDecoder } from "cborg";

import type { ScannedUR } from "./types.js";

export type XpubType = "xpub";

export interface ParsedXpub {
  hdKey: HDKey;
  type: XpubType;
  /** BIP-44 purpose index: 44 for EVM */
  purpose: number | undefined;
  /** BIP-44 coin type: 60 = ETH */
  coinType: number | undefined;
  /** source-fingerprint from the origin keypath — required by Shell for signing */
  sourceFingerprint: number | undefined;
  /** device or key name from crypto-hdkey key 9, set by some wallets (e.g. Keystone) */
  name?: string;
  raw: string;
}

function get(m: unknown, k: number): unknown {
  if (m instanceof Map) return (m as Map<number, unknown>).get(k);
  return undefined;
}

const passthrough = (v: unknown) => v;

function decodeCbor(cbor: Uint8Array): Map<number, unknown> {
  return cborDecode(cbor, {
    useMaps: true,
    tags: Object.assign([] as TagDecoder[], {
      303: passthrough, // crypto-hdkey
      304: passthrough, // crypto-keypath
      305: passthrough, // crypto-coin-info
    }),
  }) as Map<number, unknown>;
}

function parseCryptoHdKey(map: unknown, raw: string): ParsedXpub {
  const keyData = get(map, 3) as Uint8Array | undefined;
  const chainCode = get(map, 4) as Uint8Array | undefined;

  if (!keyData || !chainCode) {
    throw new Error("crypto-hdkey missing key-data or chain-code");
  }

  let purpose: number | undefined;
  let coinType: number | undefined;
  let sourceFingerprint: number | undefined;
  const origin = get(map, 6);
  if (origin) {
    const components = get(origin, 1);
    if (Array.isArray(components)) {
      if (components.length >= 1) purpose = components[0] as number;
      if (components.length >= 3) coinType = components[2] as number;
    }
    sourceFingerprint = get(origin, 2) as number | undefined;
  }

  const name = get(map, 9) as string | undefined;

  const hdKey = new HDKey({ publicKey: keyData, chainCode });
  return { hdKey, type: "xpub", purpose, coinType, sourceFingerprint, name, raw };
}

function parseScannedUR(scanned: ScannedUR): ParsedXpub | ParsedXpub[] {
  const { type, cbor } = scanned;
  const raw = `ur:${type}`;

  if (type !== "crypto-hdkey" && type !== "crypto-account") {
    throw new Error(`Unsupported UR type: ${type}`);
  }

  const map = decodeCbor(cbor);

  if (type === "crypto-hdkey") {
    return parseCryptoHdKey(map, raw);
  }

  const accounts = map.get(2) as unknown[] | undefined;
  if (!Array.isArray(accounts) || accounts.length === 0) {
    throw new Error("crypto-account contains no keys");
  }
  return accounts.map((entry) => parseCryptoHdKey(entry, raw));
}

export function parseXpub(input: ScannedUR | string): ParsedXpub[] {
  if (typeof input !== "string") {
    const result = parseScannedUR(input);
    return Array.isArray(result) ? result : [result];
  }
  // Raw base58 xpub string — @scure/bip32 handles decoding directly
  const hdKey = HDKey.fromExtendedKey(input.trim());
  return [
    {
      hdKey,
      type: "xpub",
      purpose: undefined,
      coinType: undefined,
      sourceFingerprint: undefined,
      raw: input.trim(),
    },
  ];
}
