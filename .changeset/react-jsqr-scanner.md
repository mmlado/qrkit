---
"@qrkit/react": patch
---

Replace `qr-scanner` (WASM) with `jsQR` (pure JS) for broader compatibility. Works in browser extensions, service workers, and any environment where WebAssembly workers are restricted.
