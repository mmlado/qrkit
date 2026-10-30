import { CborTag } from "./cbor.js";

// CBOR tag for crypto-keypath
const TAG_KEYPATH = 304;

const HARDENED_OFFSET = 0x80000000;

// crypto-keypath components: index, hardened, index, hardened, ...
function parseDerivationPath(path: string): (number | boolean)[] {
  const [root, ...segments] = path.split("/");
  if (root !== "m" || segments.length === 0) {
    throw new Error(`Invalid derivation path: ${path}`);
  }
  return segments.flatMap((segment) => {
    const match = /^(\d+)(['h])?$/.exec(segment);
    if (!match || Number(match[1]) >= HARDENED_OFFSET) {
      throw new Error(`Invalid derivation path: ${path}`);
    }
    return [Number(match[1]), match[2] !== undefined];
  });
}

export function buildKeypath(
  derivationPath: string,
  sourceFingerprint: number | undefined,
): CborTag {
  const keypathMap = new Map<number, unknown>([[1, parseDerivationPath(derivationPath)]]);
  if (sourceFingerprint !== undefined) {
    keypathMap.set(2, sourceFingerprint);
  }
  return new CborTag(TAG_KEYPATH, keypathMap);
}
