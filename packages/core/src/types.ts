export interface ScannedUR {
  type: string;
  cbor: Uint8Array;
}

export type Chain = "evm" | "btc";

export interface QRKitConfig {
  /** Which chains the dApp supports. Accounts for other chains are excluded.
   *  If omitted, all supported chains are tried. */
  chains?: Chain[];
}

export interface EvmAccount {
  chain: "evm";
  address: string;
  publicKey: string;
  /** source-fingerprint from the scanned xpub — required by Shell for signing */
  sourceFingerprint: number | undefined;
  /** device or key name as reported by the hardware wallet, if available */
  device: string | undefined;
}

export interface BtcAccount {
  chain: "btc";
  address: string;
  /** BIP-44 script type implied by the derivation purpose */
  scriptType: "p2wpkh" | "p2sh-p2wpkh" | "p2pkh";
  publicKey: string;
  sourceFingerprint: number | undefined;
  device: string | undefined;
}

export type Account = EvmAccount | BtcAccount;
