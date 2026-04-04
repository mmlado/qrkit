import { URDecoder } from "@ngraveio/bc-ur";

// Real UR captured from a Shell device (m/44'/60'/0')
export const ETH_HDKEY_UR =
  "ur:crypto-hdkey/osaowkaxhdclaojyhdtidmwprpltktftfefxmymottrfndlbiofwehbdgsbwgeglkstsembgkklfgsaahdcxghnbrsbzylkeiyuecfmwnlbggwhtkownwdeylahgjsykwshecxmhamsfecvtdeyaamtaaddyotadlncsdwykcsfnykaeykaocyiscmcyceaxaxaycylebgmkbzasjngrihkkiahsjpiecxguisihjzjzbkjohsiaiajlkpjtjydmjkjyhsjtiehsjpiefrcntszm";

// Known values derived from the Shell device key above
export const ETH_ADDRESS = "0xa786EC7488a340964fc4a0367144436bEb7904cE";
export const SOURCE_FINGERPRINT = 0x68161a1c;

export function urToCbor(ur: string): Uint8Array {
  const decoder = new URDecoder();
  decoder.receivePart(ur);
  return new Uint8Array(decoder.resultUR().cbor);
}
