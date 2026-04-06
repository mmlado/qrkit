import { encode, CborTag } from "../cbor.js";
import { encodeURParts } from "../urEncoding.js";

// ERC-4527 eth-sign-request data types
export const EthDataType = {
  /** Legacy transaction (RLP-encoded). Wallet applies EIP-155: v = 35 + 2*chainId + recId */
  LegacyTransaction: 1,
  /** EIP-712 typed data bytes. Wallet hashes internally. */
  TypedData: 2,
  /** Personal message (EIP-191). Wallet prepends "\x19Ethereum Signed Message:\n{len}". */
  PersonalMessage: 3,
  /** EIP-1559 transaction (RLP-encoded). Wallet uses v = recId. */
  TypedTransaction: 4,
} as const;

export type EthDataTypeValue = (typeof EthDataType)[keyof typeof EthDataType];

// CBOR tag for crypto-keypath
const TAG_KEYPATH = 304;

function randomBytes(n: number): Uint8Array {
  const buf = new Uint8Array(n);
  crypto.getRandomValues(buf);
  return buf;
}

function buildKeypath(
  purpose: number,
  coinType: number,
  sourceFingerprint: number | undefined,
): CborTag {
  // m/purpose'/coinType'/0'/0/0
  const components = [purpose, true, coinType, true, 0, true, 0, false, 0, false];
  const keypathMap = new Map<number, unknown>([[1, components]]);
  if (sourceFingerprint !== undefined) {
    keypathMap.set(2, sourceFingerprint);
  }
  return new CborTag(TAG_KEYPATH, keypathMap);
}

export interface EthSignRequestParams {
  /** Raw sign data. For PersonalMessage, a string is UTF-8 encoded automatically. */
  signData: Uint8Array | string;
  /** ERC-4527 data type. Defaults to PersonalMessage (3). Use EthDataType constants. */
  dataType?: number;
  address: string;
  sourceFingerprint: number | undefined;
  /** Chain ID — required by the wallet for v-value encoding on LegacyTransaction (type 1). */
  chainId?: number;
  origin?: string;
}

function buildEthSignRequestCbor(params: EthSignRequestParams): Uint8Array {
  const {
    signData,
    dataType = EthDataType.PersonalMessage,
    address,
    sourceFingerprint,
    chainId,
    origin = "qrkit",
  } = params;

  const requestId = randomBytes(16);
  const signBytes =
    typeof signData === "string" ? new TextEncoder().encode(signData) : signData;
  const keypath = buildKeypath(44, 60, sourceFingerprint);

  const addrHex = address.replace(/^0x/i, "");
  const addrBytes = new Uint8Array(addrHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));

  // Keys must be in strictly ascending order for zcbor (Shell firmware decoder).
  const map = new Map<number, unknown>([
    [1, new CborTag(37, requestId)], // request-id: uuid = #6.37(bstr)
    [2, signBytes], // sign-data
    [3, dataType], // data-type
  ]);

  if (chainId !== undefined) {
    map.set(4, chainId); // chain-id — must come before key 5
  }

  map.set(5, keypath); // derivation-path
  map.set(6, addrBytes); // address
  map.set(7, origin); // origin

  return encode(map);
}

export function buildEthSignRequestURParts(params: EthSignRequestParams): string[] {
  return encodeURParts(buildEthSignRequestCbor(params), "eth-sign-request");
}

export function buildEthSignRequestUR(params: EthSignRequestParams): string {
  return encodeURParts(buildEthSignRequestCbor(params), "eth-sign-request")[0];
}
