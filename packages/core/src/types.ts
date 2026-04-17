export interface ScannedUR {
  type: string;
  cbor: Uint8Array;
}

export type Chain = "evm" | "btc";

export interface QRKitConfig {
  /** Which chains the dApp supports. Accounts for other chains are excluded.
   *  If omitted, all supported chains are tried. */
  chains?: Chain[];
  /** Address index to derive (the last component of the path). Defaults to 0. */
  addressIndex?: number;
}

export interface EvmAccount {
  chain: "evm";
  address: string;
  publicKey: string;
  /** BIP-44 derivation path for the derived address, e.g. "m/44'/60'/0'/0/0" */
  derivationPath: string;
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
  /** BIP-44 derivation path for the derived address, e.g. "m/84'/0'/0'/0/0" */
  derivationPath: string;
  sourceFingerprint: number | undefined;
  device: string | undefined;
}

export type Account = EvmAccount | BtcAccount;
