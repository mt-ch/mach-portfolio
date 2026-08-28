import type { ReactNode } from "react";

import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ThemeProvider, useTheme } from "./ThemeProvider";

function stubPrefersDark(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockReturnValue({
      matches,
      media: "(prefers-color-scheme: dark)",
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList),
  );
}

const wrapper = ({ children }: { children: ReactNode }) => <ThemeProvider>{children}</ThemeProvider>;

describe("ThemeProvider / useTheme", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("throws when useTheme is read outside a ThemeProvider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useTheme())).toThrow(/ThemeProvider/);
  });

  it("defaults to the OS preference when nothing is stored", () => {
    stubPrefersDark(true);
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe("dark");
  });

  it("defaults to light when the OS preference is light and nothing is stored", () => {
    stubPrefersDark(false);
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe("light");
  });

  it("prefers a stored choice over the OS preference", () => {
    stubPrefersDark(true);
    window.localStorage.setItem("theme", "light");
    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.theme).toBe("light");
  });

  it("applies the dark class to the document element once resolved", () => {
    stubPrefersDark(true);
    renderHook(() => useTheme(), { wrapper });

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("does not apply the dark class when the theme is light", () => {
    stubPrefersDark(false);
    renderHook(() => useTheme(), { wrapper });

    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("toggles the theme and flips the dark class", () => {
    stubPrefersDark(false);
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => result.current.toggle());

    expect(result.current.theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("persists the toggled choice to localStorage", () => {
    stubPrefersDark(false);
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => result.current.toggle());

    expect(window.localStorage.getItem("theme")).toBe("dark");
  });

  it("toggling back to light removes the dark class and persists it", () => {
    stubPrefersDark(true);
    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => result.current.toggle());

    expect(result.current.theme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(window.localStorage.getItem("theme")).toBe("light");
  });
});
