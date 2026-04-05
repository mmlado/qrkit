import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useURDecoder } from "../hooks/useURDecoder.js";

// Real single-part UR from a Shell device (eth-hdkey)
const ETH_HDKEY_UR =
  "ur:crypto-hdkey/osaowkaxhdclaojyhdtidmwprpltktftfefxmymottrfndlbiofwehbdgsbwgeglkstsembgkklfgsaahdcxghnbrsbzylkeiyuecfmwnlbggwhtkownwdeylahgjsykwshecxmhamsfecvtdeyaamtaaddyotadlncsdwykcsfnykaeykaocyiscmcyceaxaxaycylebgmkbzasjngrihkkiahsjpiecxguisihjzjzbkjohsiaiajlkpjtjydmjkjyhsjtiehsjpiefrcntszm";

describe("useURDecoder", () => {
  it("calls onScan immediately for plain (non-UR) strings", () => {
    const onScan = vi.fn().mockReturnValue(true);
    const { result } = renderHook(() => useURDecoder({ onScan }));

    let done: boolean;
    act(() => {
      done = result.current.receivePart("plain text");
    });

    expect(onScan).toHaveBeenCalledWith("plain text");
    expect(done!).toBe(true);
  });

  it("returns false from onScan keeps scanning for plain strings", () => {
    const onScan = vi.fn().mockReturnValue(false);
    const { result } = renderHook(() => useURDecoder({ onScan }));

    let done: boolean;
    act(() => {
      done = result.current.receivePart("plain text");
    });

    expect(done!).toBe(false);
  });

  it("decodes a single-part UR and calls onScan with ScannedUR", () => {
    const onScan = vi.fn().mockReturnValue(true);
    const { result } = renderHook(() => useURDecoder({ onScan }));

    let done: boolean;
    act(() => {
      done = result.current.receivePart(ETH_HDKEY_UR);
    });

    expect(onScan).toHaveBeenCalledOnce();
    const arg = onScan.mock.calls[0][0];
    expect(arg).toMatchObject({ type: "crypto-hdkey" });
    expect(arg.cbor).toBeInstanceOf(Uint8Array);
    expect(done!).toBe(true);
  });

  it("sets progress while receiving UR parts", () => {
    const onScan = vi.fn().mockReturnValue(true);
    const { result } = renderHook(() => useURDecoder({ onScan }));

    act(() => {
      result.current.receivePart(ETH_HDKEY_UR);
    });

    // After completion with onScan returning true we don't reset — progress reflects last value
    expect(result.current.progress).not.toBeNull();
  });

  it("resets decoder when onScan returns false after completion", () => {
    const onScan = vi.fn().mockReturnValue(false);
    const { result } = renderHook(() => useURDecoder({ onScan }));

    act(() => {
      result.current.receivePart(ETH_HDKEY_UR);
    });

    expect(result.current.progress).toBeNull();
  });

  it("reset() clears progress", () => {
    const onScan = vi.fn().mockReturnValue(false);
    const { result } = renderHook(() => useURDecoder({ onScan }));

    act(() => {
      result.current.receivePart(ETH_HDKEY_UR);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.progress).toBeNull();
  });
});
