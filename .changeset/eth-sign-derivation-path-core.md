---
"@qrkit/core": minor
---

Add an optional `derivationPath` to `EthSignRequestParams`. The eth-sign-request keypath uses it instead of always naming `m/44'/60'/0'/0/0`, which stays the default. An invalid path throws.
