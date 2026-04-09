import { bech32, createBase58check } from "@scure/base";
import { ripemd160 } from "@noble/hashes/legacy.js";
import { sha256 } from "@noble/hashes/sha2.js";

export type BtcScriptType = "p2wpkh" | "p2sh-p2wpkh" | "p2pkh";

const base58check = createBase58check(sha256);

function hash160(bytes: Uint8Array): Uint8Array {
  return ripemd160(sha256(bytes));
}

/** Native SegWit — P2WPKH, `bc1q...` */
export function pubKeyToP2wpkh(compressedPubKey: Uint8Array): string {
  const h = hash160(compressedPubKey);
  const words = bech32.toWords(h);
  return bech32.encode("bc", [0, ...words]);
}

/** Nested SegWit — P2SH-P2WPKH, `3...` */
export function pubKeyToP2shP2wpkh(compressedPubKey: Uint8Array): string {
  const h = hash160(compressedPubKey);
  // redeemScript = OP_0 <20-byte-pubkey-hash>
  const redeemScript = new Uint8Array(22);
  redeemScript[0] = 0x00;
  redeemScript[1] = 0x14;
  redeemScript.set(h, 2);
  const scriptHash = hash160(redeemScript);
  const payload = new Uint8Array(21);
  payload[0] = 0x05; // P2SH version byte
  payload.set(scriptHash, 1);
  return base58check.encode(payload);
}

/** Legacy — P2PKH, `1...` */
export function pubKeyToP2pkh(compressedPubKey: Uint8Array): string {
  const h = hash160(compressedPubKey);
  const payload = new Uint8Array(21);
  payload[0] = 0x00; // mainnet P2PKH version byte
  payload.set(h, 1);
  return base58check.encode(payload);
}
