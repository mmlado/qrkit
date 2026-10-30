import { encode, CborTag } from "../cbor.js";
import { buildKeypath } from "../keypath.js";
import { encodeURParts } from "../urEncoding.js";
import type { BtcScriptType } from "./address.js";

export const BtcDataType = {
  Message: 1,
} as const;

export type BtcDataTypeValue = (typeof BtcDataType)[keyof typeof BtcDataType];

const PURPOSE_BY_SCRIPT_TYPE = {
  p2wpkh: 84,
  "p2sh-p2wpkh": 49,
  p2pkh: 44,
} as const satisfies Record<BtcScriptType, number>;

function randomBytes(n: number): Uint8Array {
  const buf = new Uint8Array(n);
  crypto.getRandomValues(buf);
  return buf;
}

function defaultDerivationPath(scriptType: BtcScriptType): string {
  return `m/${PURPOSE_BY_SCRIPT_TYPE[scriptType]}'/0'/0'/0/0`;
}

export interface BtcSignRequestParams {
  /** Raw message data. Strings are UTF-8 encoded automatically. */
  signData: Uint8Array | string;
  address: string;
  /** BTC script type for choosing m/44', m/49', or m/84'. */
  scriptType: BtcScriptType;
  sourceFingerprint: number | undefined;
  /** BIP-32 path of the signing key, e.g. "m/84'/0'/1'/0/0". Defaults to the script type's "m/purpose'/0'/0'/0/0". */
  derivationPath?: string;
  origin?: string;
}

function buildBtcSignRequestCbor(params: BtcSignRequestParams): Uint8Array {
  const {
    signData,
    address,
    scriptType,
    sourceFingerprint,
    derivationPath = defaultDerivationPath(scriptType),
    origin = "qrkit",
  } = params;
  const requestId = randomBytes(16);
  const signBytes =
    typeof signData === "string" ? new TextEncoder().encode(signData) : signData;
  const keypath = buildKeypath(derivationPath, sourceFingerprint);

  return encode(
    new Map<number, unknown>([
      [1, new CborTag(37, requestId)], // request-id: uuid = #6.37(bstr)
      [2, signBytes], // sign-data
      [3, BtcDataType.Message], // data-type
      [4, [keypath]], // btc-derivation-paths
      [5, [address]], // btc-addresses
      [6, origin], // origin
    ]),
  );
}

export function buildBtcSignRequestURParts(params: BtcSignRequestParams): string[] {
  return encodeURParts(buildBtcSignRequestCbor(params), "btc-sign-request");
}

export function buildBtcSignRequestUR(params: BtcSignRequestParams): string {
  return encodeURParts(buildBtcSignRequestCbor(params), "btc-sign-request")[0];
}
