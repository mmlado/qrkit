import { webcrypto } from "crypto";

import "@testing-library/jest-dom";

// jsdom doesn't expose crypto.getRandomValues — polyfill with Node's webcrypto
Object.defineProperty(globalThis, "crypto", {
  value: webcrypto,
  writable: true,
});
