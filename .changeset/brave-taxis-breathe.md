---
"@qrkit/core": major
---

BREAKING: Parsed EVM and BTC accounts now expose account-level xpubs and require callers to derive concrete addresses with `deriveAddress(index)` instead of reading a single pre-derived address.
