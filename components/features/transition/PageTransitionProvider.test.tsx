import { render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FIRST_LOAD_FONT_CAP_MS } from "@/lib/transition/constants";

// gsap.matchMedia: default to "no reduced-motion preference" (the add
// callback for `(prefers-reduced-motion: reduce)` never runs), the
// full-motion path most tests expect.
let mockMatchMediaShouldMatch = false;

// GSAP tweens/timelines fire their completion callbacks synchronously so
// the reducer walks the full phase sequence without real animation time.
vi.mock("gsap", () => {
  const to = vi.fn((_target: unknown, vars: { onComplete?: () => void }) => {
    vars.onComplete?.();
    return { kill: vi.fn() };
  });
  const timeline = vi.fn((vars: { onComplete?: () => void }) => {
    const tl = { to: vi.fn(() => tl), fromTo: vi.fn(() => tl), kill: vi.fn() };
    vars.onComplete?.();
    return tl;
  });
  const matchMedia = vi.fn(() => ({
    add: (_query: string, callback: () => void | (() => void)) => {
      if (mockMatchMediaShouldMatch) callback();
    },
    revert: vi.fn(),
  }));
  return { default: { to, set: vi.fn(), timeline, matchMedia } };
});

vi.mock("@gsap/react", () => ({
  useGSAP: (callback: () => void | (() => void), options?: { dependencies?: unknown[] }) => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => callback(), options?.dependencies ?? []);
  },
}));

import { PageTransitionProvider } from "./PageTransitionProvider";

// document.fonts.ready gates the first-load uncover. jsdom has no font
// loading, so stub a resolved promise by default.
let fontsReady: Promise<unknown>;

beforeEach(() => {
  mockMatchMediaShouldMatch = false;
  fontsReady = Promise.resolve();
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: {
      get ready() {
        return fontsReady;
      },
    },
  });
});

afterEach(() => {
  vi.useRealTimers();
});

const panelStyle = () => document.querySelector("[aria-hidden]")?.getAttribute("style") ?? "";

describe("PageTransitionProvider", () => {
  it("renders its children", () => {
    render(
      <PageTransitionProvider>
        <p>page content</p>
      </PageTransitionProvider>,
    );

    expect(screen.getByText("page content")).toBeInTheDocument();
  });

  it("renders the overlay opaque on first paint so the page loads covered", () => {
    render(
      <PageTransitionProvider>
        <p>page content</p>
      </PageTransitionProvider>,
    );

    const style = panelStyle();
    expect(style).toContain("visibility: visible");
    expect(style).toContain("opacity: 1");
    expect(style).toContain("background-color: var(--background)");
    expect(style).toContain("pointer-events: auto");
  });

  it("lifts the first-load cover once, after fonts are ready", async () => {
    render(
      <PageTransitionProvider>
        <p>page content</p>
      </PageTransitionProvider>,
    );

    await waitFor(() => expect(panelStyle()).toContain("visibility: hidden"));
    expect(panelStyle()).toContain("pointer-events: none");
  });

  it("lifts the first-load cover when the font cap elapses before fonts resolve", async () => {
    fontsReady = new Promise(() => {});

    render(
      <PageTransitionProvider>
        <p>page content</p>
      </PageTransitionProvider>,
    );

    await waitFor(() => expect(panelStyle()).toContain("visibility: hidden"), {
      timeout: FIRST_LOAD_FONT_CAP_MS + 500,
    });
  });

  it("uses the opacity-only fade for a reduced-motion first load", async () => {
    mockMatchMediaShouldMatch = true;

    render(
      <PageTransitionProvider>
        <p>page content</p>
      </PageTransitionProvider>,
    );

    await waitFor(() => expect(panelStyle()).toContain("pointer-events: none"));
  });
});
