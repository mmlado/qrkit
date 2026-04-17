import { HDKey } from "@scure/bip32";
import { decode as cborDecode, type TagDecoder } from "cborg";

import type { ScannedUR } from "./types.js";

export type XpubType = "xpub";

export interface ParsedXpub {
  hdKey: HDKey;
  type: XpubType;
  /** BIP-44 purpose index: 44 for EVM, 44/49/84 for supported BTC scripts */
  purpose: number | undefined;
  /** BIP-44 coin type: 60 = ETH, 0 = BTC */
  coinType: number | undefined;
  /** BIP-44 account index from the origin keypath (components[4]) */
  accountIndex: number | undefined;
  /** source-fingerprint from the origin keypath — required by Shell for signing */
  sourceFingerprint: number | undefined;
  /** device or key name from crypto-hdkey key 9, set by some wallets (e.g. Keystone) */
  name?: string;
  raw: string;
}

type CborMap = Map<number, unknown>;

function get(m: unknown, k: number): unknown {
  if (m instanceof Map) return (m as Map<number, unknown>).get(k);
  return undefined;
}

function bytesFromCbor(value: unknown): Uint8Array | undefined {
  if (value instanceof Uint8Array) return value;

  if (value instanceof Map && value.get("type") === "Buffer") {
    const data = value.get("data");
    if (
      Array.isArray(data) &&
      data.every((byte) => Number.isInteger(byte) && byte >= 0 && byte <= 0xff)
    ) {
      return new Uint8Array(data);
    }
  }

  return undefined;
}

const passthrough = (v: unknown) => v;

function decodeCbor(cbor: Uint8Array): Map<number, unknown> {
  // Connection payloads often wrap the inner hdkey/output structures in semantic CBOR tags
  // (script expressions, crypto-output, vendor-specific wrappers, etc.). For connection
  // parsing we only care about the inner map/bytes shape, so tags are treated as annotations
  // and stripped during decode. Required structure is validated explicitly later.
  const tags = new Proxy([] as TagDecoder[], {
    get(target, property, receiver) {
      if (typeof property === "string" && /^\d+$/.test(property)) {
        return passthrough;
      }
      return Reflect.get(target, property, receiver);
    },
  });

  return cborDecode(cbor, {
    useMaps: true,
    tags,
  }) as Map<number, unknown>;
}

function isCborMap(value: unknown): value is CborMap {
  return value instanceof Map;
}

function assertCryptoHdKeyShape(value: unknown): CborMap {
  if (!isCborMap(value)) {
    throw new Error("crypto-hdkey entry must be a CBOR map");
  }

  if (!value.has(3) || !value.has(4)) {
    throw new Error("crypto-hdkey missing key-data or chain-code");
  }

  return value;
}

function parseCryptoHdKey(map: CborMap, raw: string, fallbackName?: string): ParsedXpub {
  const keyData = bytesFromCbor(get(map, 3));
  const chainCode = bytesFromCbor(get(map, 4));

  if (!keyData || !chainCode) {
    throw new Error("crypto-hdkey missing key-data or chain-code");
  }

  let purpose: number | undefined;
  let coinType: number | undefined;
  let accountIndex: number | undefined;
  let sourceFingerprint: number | undefined;
  const origin = get(map, 6);
  if (origin) {
    const components = get(origin, 1);
    if (Array.isArray(components)) {
      if (components.length >= 1) purpose = components[0] as number;
      if (components.length >= 3) coinType = components[2] as number;
      if (components.length >= 5) accountIndex = components[4] as number;
    }
    sourceFingerprint = get(origin, 2) as number | undefined;
  }

  const name = (get(map, 9) as string | undefined) ?? fallbackName;

  const hdKey = new HDKey({ publicKey: keyData, chainCode });
  return {
    hdKey,
    type: "xpub",
    purpose,
    coinType,
    accountIndex,
    sourceFingerprint,
    name,
    raw,
  };
}

function parseScannedUR(scanned: ScannedUR): ParsedXpub | ParsedXpub[] {
  const { type, cbor } = scanned;
  const raw = `ur:${type}`;

  if (
    type !== "crypto-hdkey" &&
    type !== "crypto-account" &&
    type !== "crypto-multi-accounts"
  ) {
    throw new Error(`Unsupported UR type: ${type}`);
  }

  const map = decodeCbor(cbor);

  if (type === "crypto-hdkey") {
    return parseCryptoHdKey(assertCryptoHdKeyShape(map), raw);
  }

  const accounts = map.get(2) as unknown[] | undefined;
  if (!Array.isArray(accounts) || accounts.length === 0) {
    throw new Error(`${type} contains no keys`);
  }
  const fallbackName =
    type === "crypto-multi-accounts" ? (map.get(3) as string | undefined) : undefined;
  return accounts.map((entry) =>
    parseCryptoHdKey(assertCryptoHdKeyShape(entry), raw, fallbackName),
  );
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
      accountIndex: undefined,
      sourceFingerprint: undefined,
      raw: input.trim(),
    },
  ];
}
