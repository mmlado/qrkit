---
"@qrkit/core": minor
---

Add an optional `derivationPath` to `BtcSignRequestParams`. The btc-sign-request keypath uses it instead of always naming `m/purpose'/0'/0'/0/0`, which stays the default for the script type. An invalid path throws. The core README now shows the `deriveAddress(index)` API.
