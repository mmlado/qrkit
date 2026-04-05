import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useQRParts } from "../hooks/useQRParts.js";

describe("useQRParts", () => {
  it("returns empty string and zero totals for empty parts", () => {
    const { result } = renderHook(() => useQRParts({ parts: [] }));
    expect(result.current.part).toBe("");
    expect(result.current.total).toBe(0);
    expect(result.current.frame).toBe(0);
  });

  it("returns the single part immediately for one-element array", () => {
    const { result } = renderHook(() => useQRParts({ parts: ["ur:abc"] }));
    expect(result.current.part).toBe("ur:abc");
    expect(result.current.total).toBe(1);
    expect(result.current.frame).toBe(0);
  });

  describe("animated (multiple parts)", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("starts at frame 0", () => {
      const parts = ["part1", "part2", "part3"];
      const { result } = renderHook(() => useQRParts({ parts, interval: 100 }));
      expect(result.current.frame).toBe(0);
      expect(result.current.part).toBe("part1");
    });

    it("advances frames on interval", () => {
      const parts = ["part1", "part2", "part3"];
      const { result } = renderHook(() => useQRParts({ parts, interval: 100 }));

      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(result.current.frame).toBe(1);
      expect(result.current.part).toBe("part2");

      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(result.current.frame).toBe(2);
      expect(result.current.part).toBe("part3");
    });

    it("wraps back to frame 0 after the last part", () => {
      const parts = ["part1", "part2"];
      const { result } = renderHook(() => useQRParts({ parts, interval: 100 }));

      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(result.current.frame).toBe(0);
    });

    it("resets to frame 0 when parts change", () => {
      const parts = ["part1", "part2"];
      const { result, rerender } = renderHook(
        ({ parts }) => useQRParts({ parts, interval: 100 }),
        { initialProps: { parts } },
      );

      act(() => {
        vi.advanceTimersByTime(100);
      });
      expect(result.current.frame).toBe(1);

      rerender({ parts: ["new1", "new2", "new3"] });
      expect(result.current.frame).toBe(0);
    });
  });
});
