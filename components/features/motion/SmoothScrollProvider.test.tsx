import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const lenisConstructor = vi.fn();

vi.mock("lenis", () => ({
  default: class {
    constructor(options: unknown) {
      lenisConstructor(options);
    }
    on() {}
    off() {}
    raf() {}
    resize() {}
    scrollTo() {}
    destroy() {}
  },
}));

// GSAP's ticker would otherwise start a real rAF loop in jsdom.
vi.mock("gsap", () => ({
  default: {
    registerPlugin: vi.fn(),
    ticker: { add: vi.fn(), remove: vi.fn(), lagSmoothing: vi.fn() },
  },
}));

vi.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: { update: vi.fn(), refresh: vi.fn() },
}));

let currentPathname = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => currentPathname,
}));

function stubReducedMotion(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("reduced-motion") ? matches : false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

import { SmoothScrollProvider } from "./SmoothScrollProvider";

function renderWithScrollContainer(ui: React.ReactNode) {
  return render(<div data-scroll-container="">{ui}</div>);
}

beforeEach(() => {
  currentPathname = "/";
});

afterEach(() => {
  vi.unstubAllGlobals();
  lenisConstructor.mockClear();
});

describe("SmoothScrollProvider", () => {
  it("renders children without a Lenis instance under reduce-motion", async () => {
    stubReducedMotion(true);

    renderWithScrollContainer(
      <SmoothScrollProvider>
        <p>page content</p>
      </SmoothScrollProvider>,
    );

    expect(await screen.findByText("page content")).toBeInTheDocument();
    expect(lenisConstructor).not.toHaveBeenCalled();
  });

  it("creates a Lenis instance bound to the scroll container otherwise", async () => {
    stubReducedMotion(false);

    renderWithScrollContainer(
      <SmoothScrollProvider>
        <p>page content</p>
      </SmoothScrollProvider>,
    );

    await waitFor(() => expect(lenisConstructor).toHaveBeenCalledTimes(1));

    const options = lenisConstructor.mock.calls[0][0] as { wrapper: HTMLElement };
    expect(options.wrapper).toHaveAttribute("data-scroll-container");
  });
});
