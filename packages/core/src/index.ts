// Types
export type { ScannedUR, Chain, QRKitConfig, Account, EvmAccount } from "./types.js";
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
