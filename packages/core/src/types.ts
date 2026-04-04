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
}

// BtcAccount will be added here when Bitcoin support is implemented.

export type Account = EvmAccount;
