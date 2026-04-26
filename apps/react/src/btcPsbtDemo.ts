import { ripemd160 } from "@noble/hashes/legacy.js";
import { sha256 } from "@noble/hashes/sha2.js";

import type { BtcDerivedAddress } from "@qrkit/core";

const DUMMY_INPUT_VALUE = 100_000;
const DUMMY_OUTPUT_VALUE = 90_000;

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error("Invalid hex");
  return new Uint8Array(hex.match(/.{2}/g)?.map((byte) => parseInt(byte, 16)) ?? []);
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function encodeVarInt(value: number): Uint8Array {
  if (value < 0xfd) return Uint8Array.of(value);
  if (value <= 0xffff) return Uint8Array.of(0xfd, value & 0xff, (value >>> 8) & 0xff);
  throw new Error("Value too large");
}

function encodeU32LE(value: number): Uint8Array {
  return Uint8Array.of(
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff,
  );
}

function encodeU32BE(value: number): Uint8Array {
  return Uint8Array.of(
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff,
  );
}

function encodeU64LE(value: number): Uint8Array {
  const low = value >>> 0;
  const high = Math.floor(value / 0x1_0000_0000) >>> 0;
  return Uint8Array.of(
    low & 0xff,
    (low >>> 8) & 0xff,
    (low >>> 16) & 0xff,
    (low >>> 24) & 0xff,
    high & 0xff,
    (high >>> 8) & 0xff,
    (high >>> 16) & 0xff,
    (high >>> 24) & 0xff,
  );
}

function hash160(bytes: Uint8Array): Uint8Array {
  return ripemd160(sha256(bytes));
}

function doubleSha256(bytes: Uint8Array): Uint8Array {
  return sha256(sha256(bytes));
}

function reversed(bytes: Uint8Array): Uint8Array {
  return Uint8Array.from(bytes).reverse();
}

function purposeForScriptType(scriptType: BtcDerivedAddress["scriptType"]): number {
  if (scriptType === "p2wpkh") return 84;
  if (scriptType === "p2sh-p2wpkh") return 49;
  return 44;
}

function pathBytes(account: BtcDerivedAddress): Uint8Array {
  const hardened = 0x8000_0000;
  const path = [
    purposeForScriptType(account.scriptType) | hardened,
    hardened,
    hardened,
    0,
    0,
  ];
  return concatBytes(
    encodeU32BE(account.sourceFingerprint ?? 0),
    ...path.map((component) => encodeU32LE(component)),
  );
}

function p2wpkhRedeemScript(pubkeyHash: Uint8Array): Uint8Array {
  return concatBytes(Uint8Array.of(0x00, 0x14), pubkeyHash);
}

function scriptPubKey(account: BtcDerivedAddress): {
  script: Uint8Array;
  redeemScript?: Uint8Array;
} {
  const pubkeyHash = hash160(hexToBytes(account.publicKey));

  if (account.scriptType === "p2wpkh") {
    return { script: p2wpkhRedeemScript(pubkeyHash) };
  }

  if (account.scriptType === "p2sh-p2wpkh") {
    const redeemScript = p2wpkhRedeemScript(pubkeyHash);
    return {
      redeemScript,
      script: concatBytes(
        Uint8Array.of(0xa9, 0x14),
        hash160(redeemScript),
        Uint8Array.of(0x87),
      ),
    };
  }

  return {
    script: concatBytes(
      Uint8Array.of(0x76, 0xa9, 0x14),
      pubkeyHash,
      Uint8Array.of(0x88, 0xac),
    ),
  };
}

function serializeTx(args: {
  version: number;
  inputHash: Uint8Array;
  inputIndex: number;
  scriptSig: Uint8Array;
  sequence: number;
  outputs: Array<{ value: number; script: Uint8Array }>;
  locktime?: number;
}): Uint8Array {
  const outputs = concatBytes(
    encodeVarInt(args.outputs.length),
    ...args.outputs.map((output) =>
      concatBytes(
        encodeU64LE(output.value),
        encodeVarInt(output.script.length),
        output.script,
      ),
    ),
  );

  return concatBytes(
    encodeU32LE(args.version),
    Uint8Array.of(0x01),
    args.inputHash,
    encodeU32LE(args.inputIndex),
    encodeVarInt(args.scriptSig.length),
    args.scriptSig,
    encodeU32LE(args.sequence),
    outputs,
    encodeU32LE(args.locktime ?? 0),
  );
}

function keyValue(keyType: number, value: Uint8Array, keyData?: Uint8Array): Uint8Array {
  const key = keyData
    ? concatBytes(Uint8Array.of(keyType), keyData)
    : Uint8Array.of(keyType);
  return concatBytes(encodeVarInt(key.length), key, encodeVarInt(value.length), value);
}

function psbtEnvelope(
  unsignedTx: Uint8Array,
  inputEntries: Uint8Array[],
  outputCount: number,
): string {
  const globalMap = concatBytes(keyValue(0x00, unsignedTx), Uint8Array.of(0x00));
  const inputMap = concatBytes(...inputEntries, Uint8Array.of(0x00));
  const outputMaps = concatBytes(
    ...Array.from({ length: outputCount }, () => Uint8Array.of(0x00)),
  );

  return [...concatBytes(hexToBytes("70736274ff"), globalMap, inputMap, outputMaps)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function inputEntries(
  account: BtcDerivedAddress,
  prevTx?: Uint8Array,
  value = DUMMY_INPUT_VALUE,
): Uint8Array[] {
  const pubkey = hexToBytes(account.publicKey);
  const { script, redeemScript } = scriptPubKey(account);
  const entries: Uint8Array[] = [];

  if (account.scriptType === "p2pkh") {
    if (!prevTx) throw new Error("Legacy PSBT requires a previous transaction");
    entries.push(keyValue(0x00, prevTx));
  } else {
    const witnessUtxo = concatBytes(
      encodeU64LE(value),
      encodeVarInt(script.length),
      script,
    );
    entries.push(keyValue(0x01, witnessUtxo));
  }

  if (redeemScript) {
    entries.push(keyValue(0x04, redeemScript));
  }

  entries.push(keyValue(0x06, pathBytes(account), pubkey));
  return entries;
}

export function buildDemoTransactionPsbt(account: BtcDerivedAddress): string {
  const { script } = scriptPubKey(account);
  const prevTx =
    account.scriptType === "p2pkh"
      ? serializeTx({
          version: 2,
          inputHash: new Uint8Array(32),
          inputIndex: 0xffffffff,
          scriptSig: new Uint8Array(),
          sequence: 0xffffffff,
          outputs: [{ value: DUMMY_INPUT_VALUE, script }],
        })
      : undefined;

  const unsignedTx = serializeTx({
    version: 2,
    inputHash:
      prevTx === undefined
        ? new Uint8Array(32).fill(0xaa)
        : reversed(doubleSha256(prevTx)),
    inputIndex: 0,
    scriptSig: new Uint8Array(),
    sequence: 0xffffffff,
    outputs: [{ value: DUMMY_OUTPUT_VALUE, script }],
  });

  return psbtEnvelope(unsignedTx, inputEntries(account, prevTx), 1);
}

export function buildDemoBip322Psbt(account: BtcDerivedAddress): string {
  const { script } = scriptPubKey(account);
  const toSpend = serializeTx({
    version: 0,
    inputHash: new Uint8Array(32),
    inputIndex: 0xffffffff,
    scriptSig: concatBytes(Uint8Array.of(0x00, 0x20), new Uint8Array(32).fill(0x11)),
    sequence: 0,
    outputs: [{ value: 0, script }],
  });

  const unsignedTx = serializeTx({
    version: 0,
    inputHash: reversed(doubleSha256(toSpend)),
    inputIndex: 0,
    scriptSig: new Uint8Array(),
    sequence: 0,
    outputs: [{ value: 0, script: Uint8Array.of(0x6a) }],
  });

  return psbtEnvelope(unsignedTx, inputEntries(account, toSpend, 0), 1);
}
