import { parseXpub } from "./parseXpub.js";
import { deriveEvmAccount } from "./eth/deriveAccount.js";
import type { Account, Chain, EvmAccount, QRKitConfig, ScannedUR } from "./types.js";

const ALL_CHAINS: Chain[] = ["evm", "btc"];

/**
 * Parse a connection QR (crypto-hdkey or crypto-account) and return
 * only the accounts for the chains configured in QRKitConfig.
 *
 * A dApp configured with `chains: ["evm"]` will never see BTC accounts,
 * and vice versa. Both chains can be enabled with `chains: ["evm", "btc"]`.
 * If `chains` is omitted, all supported chains are tried.
 */
export function parseConnection(
  scannedUR: ScannedUR,
  config: QRKitConfig = {},
): Account[] {
  const chains = config.chains ?? ALL_CHAINS;
  const parsed = parseXpub(scannedUR);
  const accounts: Account[] = [];

  if (chains.includes("evm")) {
    const account = deriveEvmAccount(parsed);
    if (account) {
      accounts.push({ chain: "evm", ...account } satisfies EvmAccount);
    }
  }

  // "btc" — will be implemented in src/btc/ when Bitcoin support is added.

  return accounts;
}
