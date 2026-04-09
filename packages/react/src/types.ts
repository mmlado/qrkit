import type { Account, BtcSignature, Chain, CryptoPsbt } from "@qrkit/core";

export interface QRKitTheme {
  /** Primary accent color. Defaults follow MD3: light #6750A4, dark #D0BCFF */
  accent?: string;
  /** Modal background color. Defaults follow MD3: light #FFFBFE, dark #1C1B1F */
  background?: string;
  /** Modal backdrop color. Default: rgba(0,0,0,0.6) */
  backdrop?: string;
  /** Text color. Defaults follow MD3: light #1C1B1F, dark #E6E1E5 */
  text?: string;
  /** Muted/secondary text color. Defaults follow MD3: light #49454F, dark #CAC4D0 */
  textMuted?: string;
  /** Border radius. Default: 12px (MD3 "medium") */
  radius?: string;
  /** Font family. Default: inherit */
  fontFamily?: string;
}

export interface EvmSignRequest {
  chain?: "evm";
  /**
   * Data to sign. For PersonalMessage (type 3), a plain string is accepted and
   * UTF-8-encoded automatically. For transactions and typed data, pass raw bytes.
   */
  signData: Uint8Array | string;
  /**
   * ERC-4527 data type. Defaults to PersonalMessage (3 — EIP-191 personal_sign).
   * Use EthDataType constants from @qrkit/core.
   */
  dataType?: number;
  address: string;
  sourceFingerprint: number | undefined;
  /** Chain ID — required for LegacyTransaction (type 1) v-value encoding. */
  chainId?: number;
}

export interface BtcMessageSignRequest {
  chain: "btc";
  requestType: "message";
  signData: Uint8Array | string;
  address: string;
  scriptType: "p2wpkh" | "p2sh-p2wpkh" | "p2pkh";
  sourceFingerprint: number | undefined;
}

export interface BtcPsbtSignRequest {
  chain: "btc";
  requestType: "psbt";
  psbt: Uint8Array | string;
}

export type SignRequest = EvmSignRequest | BtcMessageSignRequest | BtcPsbtSignRequest;
export type SignResult = string | BtcSignature | CryptoPsbt;

export interface QRKitContextValue {
  account: Account | null;
  connect: () => void;
  disconnect: () => void;
  /** Open the sign modal and resolve with the parsed signature or signed PSBT. */
  sign: (request: SignRequest) => Promise<SignResult>;
}

export interface QRKitProviderProps {
  children: React.ReactNode;
  theme?: QRKitTheme;
  /** App name shown in the sign request origin field. Default: "qrkit" */
  appName?: string;
  /** Chains accepted by the connection modal. Defaults to all supported chains. */
  chains?: Chain[];
}
