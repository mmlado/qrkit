import { deriveBtcAccount } from "./btc/deriveAccount.js";
import { deriveEvmAccount } from "./eth/deriveAccount.js";
import { parseXpub } from "./parseXpub.js";
import type {
  Account,
  BtcAccount,
  Chain,
  EvmAccount,
  QRKitConfig,
  ScannedUR,
} from "./types.js";

const ALL_CHAINS: Chain[] = ["evm", "btc"];

/**
 * Parse a connection QR (crypto-hdkey or crypto-account) and return
 * accounts for the chains configured in QRKitConfig.
 *
 * Each returned `Account` holds the account-level xpub and exposes
 * `deriveAddress(addressIndex)` to derive any address without re-scanning.
 *
 * A dApp configured with `chains: ["evm"]` will never see BTC accounts,
 * and vice versa. Both chains can be enabled with `chains: ["evm", "btc"]`.
 * If `chains` is omitted, all supported chains are tried.
 *
 * @example
 * const scannedUR = ...; // from camera, stored in state
 * const [account] = parseConnection(scannedUR, { chains: ["evm"] });
 * const address0 = account.deriveAddress(0);
 * const address1 = account.deriveAddress(1);
 */
export function parseConnection(
  scannedUR: ScannedUR,
  config: QRKitConfig = {},
): Account[] {
  const chains = config.chains ?? ALL_CHAINS;
  const parsed = parseXpub(scannedUR);
  const accounts: Account[] = [];

  if (chains.includes("evm")) {
    for (const account of deriveEvmAccount(parsed)) {
      accounts.push(account satisfies EvmAccount);
    }
  }

  if (chains.includes("btc")) {
    for (const account of deriveBtcAccount(parsed)) {
      accounts.push(account satisfies BtcAccount);
    }
  }

  return accounts;
}
