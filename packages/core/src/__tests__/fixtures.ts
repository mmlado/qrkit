import { UrFountainDecoder } from "@qrkit/bc-ur-web";
import { HDKey } from "@scure/bip32";

import { CborTag, encode } from "../cbor.js";

// Real UR captured from a Shell device (m/44'/60'/0')
export const ETH_HDKEY_UR =
  "ur:crypto-hdkey/osaowkaxhdclaojyhdtidmwprpltktftfefxmymottrfndlbiofwehbdgsbwgeglkstsembgkklfgsaahdcxghnbrsbzylkeiyuecfmwnlbggwhtkownwdeylahgjsykwshecxmhamsfecvtdeyaamtaaddyotadlncsdwykcsfnykaeykaocyiscmcyceaxaxaycylebgmkbzasjngrihkkiahsjpiecxguisihjzjzbkjohsiaiajlkpjtjydmjkjyhsjtiehsjpiefrcntszm";

// Known values derived from the Shell device key above
export const ETH_ADDRESS = "0xa786EC7488a340964fc4a0367144436bEb7904cE";
export const SOURCE_FINGERPRINT = 0x68161a1c;
export const DEVICE_NAME = "Keycard Shell";

const MULTI_ACCOUNT_SEED = new Uint8Array(32).fill(1);

export const MULTI_ACCOUNT_DEVICE_NAME = "GapSign Test";
export const MULTI_ACCOUNT_SOURCE_FINGERPRINT = 0x01020304;
export const BTC_NATIVE_SEGWIT_ADDRESS = "bc1qe0g7q5f92pqjy3jfaana4qyzs5y9d2vrdx64ff";
export const BTC_NESTED_SEGWIT_ADDRESS = "34XtjNqFYGMyNrGF3vnFdaFZmHfJXtNBuE";
export const BTC_LEGACY_ADDRESS = "1Exq3M51dXqk8eHnosigC5DPDVYbxz9934";
export const MULTI_ACCOUNT_ETH_ADDRESS = "0xb6a0f727D8D6F0FdE430f7328904774898d95183";

export function urToCbor(ur: string): Uint8Array {
  const decoder = new UrFountainDecoder();
  decoder.receivePartUr(ur);
  return decoder.resultUr.getPayloadCbor();
}

function accountKey(path: string): HDKey {
  return HDKey.fromMasterSeed(MULTI_ACCOUNT_SEED).derive(path);
}

function bufferMap(bytes: Uint8Array): Map<string, unknown> {
  return new Map<string, unknown>([
    ["type", "Buffer"],
    ["data", Array.from(bytes)],
  ]);
}

function hdkeyMap(
  path: string,
  purpose: number,
  coinType: number,
  name?: string,
): Map<number, unknown> {
  const key = accountKey(path);
  if (!key.publicKey) throw new Error(`Missing public key for ${path}`);

  const origin = new Map<number, unknown>([
    [1, [purpose, true, coinType, true, 0, true]],
    [2, MULTI_ACCOUNT_SOURCE_FINGERPRINT],
  ]);
  const map = new Map<number, unknown>([
    [3, key.publicKey],
    [4, key.chainCode],
    [6, new CborTag(304, origin)],
  ]);

  if (name) map.set(9, name);
  return map;
}

function registryHdkeyMap(
  path: string,
  purpose: number,
  coinType: number,
): Map<number, unknown> {
  const key = accountKey(path);
  if (!key.publicKey) throw new Error(`Missing public key for ${path}`);
  if (!key.chainCode) throw new Error(`Missing chain code for ${path}`);

  return new Map<number, unknown>([
    [3, bufferMap(key.publicKey)],
    [4, bufferMap(key.chainCode)],
    [
      6,
      new CborTag(
        304,
        new Map<number, unknown>([
          [1, [purpose, true, coinType, true, 0, true]],
          [2, MULTI_ACCOUNT_SOURCE_FINGERPRINT],
        ]),
      ),
    ],
    [8, MULTI_ACCOUNT_SOURCE_FINGERPRINT],
    [9, "GapSign"],
  ]);
}

export function multiAccountCbor(): Uint8Array {
  const accounts = [
    new CborTag(303, hdkeyMap("m/84'/0'/0'", 84, 0)),
    new CborTag(303, hdkeyMap("m/49'/0'/0'", 49, 0)),
    new CborTag(303, hdkeyMap("m/44'/0'/0'", 44, 0, "Legacy BTC Key")),
    new CborTag(303, hdkeyMap("m/44'/60'/0'", 44, 60)),
  ];

  return encode(
    new Map<number, unknown>([
      [1, MULTI_ACCOUNT_SOURCE_FINGERPRINT],
      [2, accounts],
      [3, MULTI_ACCOUNT_DEVICE_NAME],
      [4, "test-device"],
    ]),
  );
}

export function cryptoAccountCbor(): Uint8Array {
  const outputs = [
    new CborTag(404, new CborTag(303, hdkeyMap("m/84'/0'/0'", 84, 0, "GapSign"))),
    new CborTag(
      400,
      new CborTag(404, new CborTag(303, hdkeyMap("m/49'/0'/0'", 49, 0, "GapSign"))),
    ),
    new CborTag(403, new CborTag(303, hdkeyMap("m/44'/0'/0'", 44, 0, "GapSign"))),
  ];

  return encode(
    new Map<number, unknown>([
      [1, MULTI_ACCOUNT_SOURCE_FINGERPRINT],
      [2, outputs],
    ]),
  );
}

export function registryStyleMultiAccountCbor(): Uint8Array {
  const accounts = [
    new CborTag(303, registryHdkeyMap("m/84'/0'/0'", 84, 0)),
    new CborTag(303, registryHdkeyMap("m/49'/0'/0'", 49, 0)),
    new CborTag(303, registryHdkeyMap("m/44'/0'/0'", 44, 0)),
    new CborTag(303, registryHdkeyMap("m/44'/60'/0'", 44, 60)),
  ];

  return encode(
    new Map<number, unknown>([
      [1, MULTI_ACCOUNT_SOURCE_FINGERPRINT],
      [2, accounts],
      [3, "GapSign"],
      [4, "01020304"],
    ]),
  );
}
