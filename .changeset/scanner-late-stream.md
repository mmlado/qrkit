---
"@qrkit/react": patch
---

Stop the camera stream when `useQRScanner` is disabled or unmounted before the camera starts. Before, a stream that arrived after cleanup stayed on.
