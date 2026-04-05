import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QRKitProvider, useQRKit } from "../context.js";

function wrapper({ children }: { children: React.ReactNode }) {
  return <QRKitProvider>{children}</QRKitProvider>;
}

describe("QRKitProvider / useQRKit", () => {
  it("throws when used outside provider", () => {
    expect(() => renderHook(() => useQRKit())).toThrow(
      "useQRKit must be used within a QRKitProvider",
    );
  });

  it("provides null account initially", () => {
    const { result } = renderHook(() => useQRKit(), { wrapper });
    expect(result.current.account).toBeNull();
  });

  it("disconnect resets account to null", () => {
    const { result } = renderHook(() => useQRKit(), { wrapper });
    act(() => result.current.disconnect());
    expect(result.current.account).toBeNull();
  });

  it("sign returns a Promise", () => {
    const { result } = renderHook(() => useQRKit(), { wrapper });
    const promise = result.current.sign({
      message: "hello",
      address: "0xabc",
      sourceFingerprint: undefined,
    });
    expect(promise).toBeInstanceOf(Promise);
    // Prevent unhandled rejection
    promise.catch(() => undefined);
  });

  it("buildThemeStyle injects a style tag when theme is provided", () => {
    renderHook(() => useQRKit(), {
      wrapper: ({ children }) => (
        <QRKitProvider theme={{ accent: "#ff0000" }}>{children}</QRKitProvider>
      ),
    });

    const styleEl = document.head.querySelector("[data-qrkit-theme]");
    expect(styleEl).not.toBeNull();
    expect(styleEl?.textContent).toContain("--qrkit-accent: #ff0000");
  });

  it("does not inject style tag when no theme is provided", () => {
    // Remove any existing theme tags
    document.head.querySelectorAll("[data-qrkit-theme]").forEach((el) => el.remove());

    renderHook(() => useQRKit(), { wrapper });

    const styleEl = document.head.querySelector("[data-qrkit-theme]");
    expect(styleEl).toBeNull();
  });
});
