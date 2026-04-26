import type { Account, BtcSignature, CryptoPsbt } from "@qrkit/core";

export function btcScriptTypeLabel(
  scriptType: "p2wpkh" | "p2sh-p2wpkh" | "p2pkh",
): string {
  if (scriptType === "p2wpkh") return "Native SegWit";
  if (scriptType === "p2sh-p2wpkh") return "Nested SegWit";
  return "Legacy";
}

export function accountTitle(account: Account): string {
  if (account.chain === "evm") return "Ethereum";
  return `Bitcoin ${btcScriptTypeLabel(account.scriptType)}`;
}

export function formatSignResult(result: string | BtcSignature | CryptoPsbt): string {
  if (typeof result === "string") return result;
  if ("psbtHex" in result) return result.psbtHex;

  return [
    `Signature: ${result.signature}`,
    `Public key: ${result.publicKey}`,
    result.requestId ? `Request ID: ${result.requestId}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}
