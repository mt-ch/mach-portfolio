import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useCursorInteractions } from "./useCursorInteractions";

let currentPathname = "/";

vi.mock("next/navigation", () => ({
  usePathname: () => currentPathname,
}));

afterEach(() => {
  currentPathname = "/";
  document.body.innerHTML = "";
});

describe("useCursorInteractions", () => {
  it("drives the variant from an element added after the hook mounts (regression lock)", () => {
    const { result } = renderHook(() => useCursorInteractions());
    expect(result.current).toEqual({ kind: "base" });

    // Late-mounted DOM — the exact case the old mount-time querySelectorAll
    // scan got wrong.
    const link = document.createElement("a");
    link.setAttribute("data-cursor", "link");
    document.body.appendChild(link);

    act(() => {
      link.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    });

    expect(result.current).toEqual({ kind: "link" });
  });

  it("resolves the variant from a nested child of the tagged element", () => {
    const { result } = renderHook(() => useCursorInteractions());

    const row = document.createElement("a");
    row.setAttribute("data-cursor", "label");
    row.setAttribute("data-cursor-label", "View Project");
    row.setAttribute("data-cursor-icon", "eye");
    const child = document.createElement("span");
    row.appendChild(child);
    document.body.appendChild(row);

    act(() => {
      child.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    });

    expect(result.current).toEqual({ kind: "label", text: "View Project", icon: "eye" });
  });

  it("resets to base on mouseout to untagged space", () => {
    const { result } = renderHook(() => useCursorInteractions());
    const btn = document.createElement("button");
    btn.setAttribute("data-cursor", "button");
    document.body.appendChild(btn);

    act(() => btn.dispatchEvent(new MouseEvent("mouseover", { bubbles: true })));
    expect(result.current).toEqual({ kind: "button" });

    act(() => btn.dispatchEvent(new MouseEvent("mouseout", { bubbles: true })));
    expect(result.current).toEqual({ kind: "base" });
  });

  it("resets to base when the route changes", () => {
    const btn = document.createElement("button");
    btn.setAttribute("data-cursor", "button");
    document.body.appendChild(btn);

    const { result, rerender } = renderHook(() => useCursorInteractions());
    act(() => btn.dispatchEvent(new MouseEvent("mouseover", { bubbles: true })));
    expect(result.current).toEqual({ kind: "button" });

    currentPathname = "/projects/example";
    act(() => rerender());

    expect(result.current).toEqual({ kind: "base" });
  });

  it("resets to base when the chat drawer toggles", async () => {
    const btn = document.createElement("button");
    btn.setAttribute("data-cursor", "button");
    document.body.appendChild(btn);

    const { result } = renderHook(() => useCursorInteractions());
    act(() => btn.dispatchEvent(new MouseEvent("mouseover", { bubbles: true })));
    expect(result.current).toEqual({ kind: "button" });

    // MutationObserver callbacks are delivered as a microtask.
    await act(async () => {
      document.documentElement.setAttribute("data-chat-open", "");
      await Promise.resolve();
    });
    expect(result.current).toEqual({ kind: "base" });

    document.documentElement.removeAttribute("data-chat-open");
  });
});
