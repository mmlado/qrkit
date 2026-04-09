import { encode, CborTag } from "../cbor.js";
import { encodeURParts } from "../urEncoding.js";
import type { BtcScriptType } from "./address.js";

export const BtcDataType = {
  Message: 1,
} as const;

export type BtcDataTypeValue = (typeof BtcDataType)[keyof typeof BtcDataType];

const TAG_KEYPATH = 304;
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

function purposeFromScriptType(scriptType: BtcScriptType): number {
  return PURPOSE_BY_SCRIPT_TYPE[scriptType];
}

function buildKeypath(
  scriptType: BtcScriptType,
  sourceFingerprint: number | undefined,
): CborTag {
  const purpose = purposeFromScriptType(scriptType);
  // m/purpose'/0'/0'/0/0
  const components = [purpose, true, 0, true, 0, true, 0, false, 0, false];
  const keypathMap = new Map<number, unknown>([[1, components]]);
  if (sourceFingerprint !== undefined) {
    keypathMap.set(2, sourceFingerprint);
  }
  return new CborTag(TAG_KEYPATH, keypathMap);
}

export interface BtcSignRequestParams {
  /** Raw message data. Strings are UTF-8 encoded automatically. */
  signData: Uint8Array | string;
  address: string;
  /** BTC script type for choosing m/44', m/49', or m/84'. */
  scriptType: BtcScriptType;
  sourceFingerprint: number | undefined;
  origin?: string;
}

function buildBtcSignRequestCbor(params: BtcSignRequestParams): Uint8Array {
  const { signData, address, scriptType, sourceFingerprint, origin = "qrkit" } = params;
  const requestId = randomBytes(16);
  const signBytes =
    typeof signData === "string" ? new TextEncoder().encode(signData) : signData;
  const keypath = buildKeypath(scriptType, sourceFingerprint);

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
