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

export interface EvmDerivedAddress {
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

export interface BtcDerivedAddress {
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

export type DerivedAddress = EvmDerivedAddress | BtcDerivedAddress;

export interface EvmAccount {
  chain: "evm";
  /** Account-level extended public key (base58), e.g. for m/44'/60'/0' */
  xpub: string;
  /** Account-level derivation path, e.g. "m/44'/60'/0'" */
  derivationPath: string;
  sourceFingerprint: number | undefined;
  device: string | undefined;
  /** Derive an address at the given index without re-scanning the QR. */
  deriveAddress(addressIndex: number): EvmDerivedAddress;
}

export interface BtcAccount {
  chain: "btc";
  xpub: string;
  scriptType: "p2wpkh" | "p2sh-p2wpkh" | "p2pkh";
  derivationPath: string;
  sourceFingerprint: number | undefined;
  device: string | undefined;
  deriveAddress(addressIndex: number): BtcDerivedAddress;
}

export type Account = EvmAccount | BtcAccount;
