// Types
export type {
  ScannedUR,
  Chain,
  QRKitConfig,
  Account,
  EvmAccount,
  BtcAccount,
} from "./types.js";
export type { ParsedXpub, XpubType } from "./parseXpub.js";

// Connection
export { parseConnection } from "./parseConnection.js";

// EVM signing
export {
  buildEthSignRequestUR,
  buildEthSignRequestURParts,
  EthDataType,
} from "./eth/signRequest.js";
export type { EthDataTypeValue, EthSignRequestParams } from "./eth/signRequest.js";
export { parseEthSignature } from "./eth/signature.js";

// BTC signing
export {
  buildBtcSignRequestUR,
  buildBtcSignRequestURParts,
  BtcDataType,
} from "./btc/signRequest.js";
export type { BtcDataTypeValue, BtcSignRequestParams } from "./btc/signRequest.js";
export { parseBtcSignature } from "./btc/signature.js";
export type { BtcSignature } from "./btc/signature.js";
export {
  buildCryptoPsbtUR,
  buildCryptoPsbtURParts,
  parseCryptoPsbt,
} from "./btc/psbt.js";
export type { CryptoPsbt } from "./btc/psbt.js";
