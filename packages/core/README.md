# @qrkit/core

Framework-agnostic protocol core for QR-based airgapped wallet flows. Designed for use in browser-based dApps.

Handles the ERC-4527 / UR / CBOR stack: decoding scanned QR exports, deriving EVM and BTC addresses, building sign requests, carrying PSBTs, and parsing signature responses. No DOM, no React, no external services.

## Install

```sh
pnpm add @qrkit/core
```

## Usage

### 1. Parse the connection QR from the wallet

Scan the `crypto-hdkey`, `crypto-account`, or `crypto-multi-accounts` QR exported by the hardware wallet, then derive the accounts you need:

```ts
import { parseConnection } from "@qrkit/core";

// scannedUR comes from a QR scanner — { type: string, cbor: Uint8Array }
const accounts = parseConnection(scannedUR, { chains: ["evm", "btc"] });
const evm = accounts.find((account) => account.chain === "evm");
const btc = accounts.find((account) => account.chain === "btc");

evm?.address; // EIP-55 checksummed address
btc?.address; // BTC address, e.g. bc1q...
btc?.scriptType; // 'p2wpkh' | 'p2sh-p2wpkh' | 'p2pkh'
evm?.sourceFingerprint; // master key fingerprint — required for signing
```

`parseConnection()` can return multiple accounts from one scan, including mixed EVM and BTC results from `crypto-multi-accounts`.

### 2. Build an EVM sign request

Encode a message as animated UR parts to display as a QR code for the wallet to scan:

```ts
import {
  buildEthSignRequestURParts,
  buildEthSignRequestUR,
  EthDataType,
} from "@qrkit/core";

// Animated QR (multiple parts for long messages)
const parts = buildEthSignRequestURParts({
  signData: message, // string (UTF-8 encoded) or Uint8Array (raw bytes)
  dataType: EthDataType.PersonalMessage, // defaults to PersonalMessage if omitted
  address: evm.address,
  sourceFingerprint: evm.sourceFingerprint,
});
// parts is string[] — cycle through them to animate the QR

// Single-frame QR (short messages)
const ur = buildEthSignRequestUR({
  signData: message,
  address: evm.address,
  sourceFingerprint: evm.sourceFingerprint,
});
```

### 3. Parse the wallet's signature response

After the user scans the wallet's response QR, decode the signature:

```ts
import { parseEthSignature } from "@qrkit/core";

const signature = parseEthSignature(scannedResponseUR);
// → '0x...' hex string, ready for ethers / viem
```

### 4. Build a BTC message sign request

Direct BTC message signing uses `btc-sign-request` and returns `btc-signature`:

```ts
import { buildBtcSignRequestURParts, parseBtcSignature } from "@qrkit/core";

const parts = buildBtcSignRequestURParts({
  signData: "Hello Bitcoin",
  address: btc.address,
  scriptType: btc.scriptType,
  sourceFingerprint: btc.sourceFingerprint,
});

const result = parseBtcSignature(scannedResponseUR);
result.signature; // base64 compact Bitcoin message signature (65 bytes)
result.publicKey; // compressed public key hex
```

### 5. Carry a BTC PSBT

Bitcoin transaction signing, and BIP-322-style message signing, use `crypto-psbt`.
qrkit carries PSBT bytes over QR; the airgapped wallet signs offline and returns a signed `crypto-psbt`.

```ts
import { buildCryptoPsbtURParts, parseCryptoPsbt } from "@qrkit/core";

const parts = buildCryptoPsbtURParts(unsignedPsbtHex);
// render parts as QR codes

const signed = parseCryptoPsbt(scannedResponseUR);
signed.psbtHex; // signed PSBT hex
```

Note: BIP-322-style message signing is also carried as `crypto-psbt`, but wallet review UX varies. Some wallets present it as a Bitcoin message flow, while others show only the proving address or a generic PSBT review.

## API

| Export                               | Description                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------- |
| `parseConnection(ur, options)`       | Parse a connection UR into `Account[]`                                          |
| `buildEthSignRequestURParts(params)` | Build animated UR parts for a sign request (`EthSignRequestParams`)             |
| `buildEthSignRequestUR(params)`      | Build a single-frame UR for a sign request (`EthSignRequestParams`)             |
| `EthDataType`                        | Constants for ERC-4527 data types (1–4)                                         |
| `parseEthSignature(ur)`              | Decode an `eth-signature` UR into a `0x...` hex string                          |
| `buildBtcSignRequestURParts(params)` | Build animated UR parts for a BTC message sign request (`BtcSignRequestParams`) |
| `buildBtcSignRequestUR(params)`      | Build a single-frame BTC message sign request UR                                |
| `BtcDataType`                        | Constants for BTC sign request data types                                       |
| `parseBtcSignature(ur)`              | Decode a `btc-signature` UR into a base64 signature and public key              |
| `buildCryptoPsbtURParts(psbt)`       | Build animated UR parts for a `crypto-psbt` request                             |
| `buildCryptoPsbtUR(psbt)`            | Build a single-frame `crypto-psbt` UR                                           |
| `parseCryptoPsbt(ur)`                | Decode a `crypto-psbt` UR into PSBT bytes and hex                               |

## Examples

```sh
pnpm --filter @qrkit/core example:eth
pnpm --filter @qrkit/core example:btc-message
pnpm --filter @qrkit/core example:btc-psbt
```

## License

[Apache 2.0](../../LICENSE)
