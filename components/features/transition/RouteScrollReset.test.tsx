import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

let currentPathname = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => currentPathname,
}));

let lenis: { scrollTo: ReturnType<typeof vi.fn> } | null = null;
vi.mock("@/components/features/motion/SmoothScrollProvider", () => ({
  getSmoothScroll: () => lenis,
}));

import { RouteScrollReset } from "./RouteScrollReset";

const scrollTo = vi.fn();

function tree() {
  return (
    <div
      data-scroll-container=""
      ref={(el) => {
        if (el) el.scrollTo = scrollTo as unknown as HTMLElement["scrollTo"];
      }}
    >
      <RouteScrollReset />
    </div>
  );
}

beforeEach(() => {
  currentPathname = "/";
  lenis = null;
  scrollTo.mockClear();
  window.history.replaceState({}, "", "/");
});

afterEach(() => {
  window.history.replaceState({}, "", "/");
});

describe("RouteScrollReset", () => {
  it("does not scroll on the first render", () => {
    render(tree());
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("snaps the scroll container to the top on a forward navigation", () => {
    const { rerender } = render(tree());

    currentPathname = "/projects/one";
    rerender(tree());

    expect(scrollTo).toHaveBeenCalledWith({ top: 0 });
  });

  it("drives Lenis to the top instead of the raw container when smooth scroll is running", () => {
    lenis = { scrollTo: vi.fn() };
    const { rerender } = render(tree());

    currentPathname = "/projects/one";
    rerender(tree());

    expect(lenis.scrollTo).toHaveBeenCalledWith(0, { immediate: true, force: true });
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("leaves the scroll position alone on a back/forward navigation", () => {
    const { rerender } = render(tree());

    window.history.pushState({}, "", "/projects/one");
    window.dispatchEvent(new PopStateEvent("popstate"));
    currentPathname = "/projects/one";
    rerender(tree());

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("still resets on a forward nav that follows a hash-only popstate", () => {
    const { rerender } = render(tree());

    // Back button on an in-page anchor: the path is unchanged, only the hash.
    window.history.pushState({}, "", "/#gallery");
    window.dispatchEvent(new PopStateEvent("popstate"));

    currentPathname = "/projects/one";
    rerender(tree());

    expect(scrollTo).toHaveBeenCalledWith({ top: 0 });
  });
});
