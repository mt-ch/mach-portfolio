import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useDrawerVisibility } from "./useDrawerVisibility";

function stubMatchMedia(initialMatches: boolean) {
  let matches = initialMatches;
  let changeListener: ((event: MediaQueryListEvent) => void) | null = null;

  const mql = {
    get matches() {
      return matches;
    },
    media: "(min-width: 640px)",
    addEventListener: (_event: "change", listener: (event: MediaQueryListEvent) => void) => {
      changeListener = listener;
    },
    removeEventListener: () => {
      changeListener = null;
    },
  };

  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue(mql as unknown as MediaQueryList),
  );

  return {
    setMatches(next: boolean) {
      matches = next;
      changeListener?.({ matches: next } as MediaQueryListEvent);
    },
  };
}

describe("useDrawerVisibility", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts closed", () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => useDrawerVisibility());
    expect(result.current.isOpen).toBe(false);
  });

  it("opens, closes, and toggles", () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => useDrawerVisibility());

    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);

    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(true);
    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(false);
  });

  it("closes on Escape while open", () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => useDrawerVisibility());

    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(result.current.isOpen).toBe(false);
  });

  it("does not toggle open state in response to Escape while already closed", () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => useDrawerVisibility());

    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(result.current.isOpen).toBe(false);
  });

  it("reports push mode at and above the sm breakpoint", () => {
    stubMatchMedia(true);
    const { result } = renderHook(() => useDrawerVisibility());
    expect(result.current.mode).toBe("push");
  });

  it("reports overlay mode below the sm breakpoint", () => {
    stubMatchMedia(false);
    const { result } = renderHook(() => useDrawerVisibility());
    expect(result.current.mode).toBe("overlay");
  });

  it("switches mode when the viewport crosses the breakpoint", () => {
    const media = stubMatchMedia(true);
    const { result } = renderHook(() => useDrawerVisibility());
    expect(result.current.mode).toBe("push");

    act(() => media.setMatches(false));
    expect(result.current.mode).toBe("overlay");
  });
});
