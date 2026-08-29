import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FIRST_LOAD_FONT_CAP_MS, HOLD_DURATION_MS } from "@/lib/transition/constants";

const push = vi.fn();
let currentPathname = "/";

// gsap.matchMedia: default to "no reduced-motion preference" (the add
// callback for `(prefers-reduced-motion: reduce)` never runs), which is
// the full-motion path every existing test expects.
let mockMatchMediaShouldMatch = false;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => currentPathname,
}));

// GSAP tweens/timelines fire their completion callbacks synchronously so
// the reducer walks the full phase sequence without real animation time.
vi.mock("gsap", () => {
  const to = vi.fn((_target: unknown, vars: { onComplete?: () => void }) => {
    vars.onComplete?.();
    return { kill: vi.fn() };
  });
  const timeline = vi.fn((vars: { onComplete?: () => void }) => {
    const tl = {
      to: vi.fn(() => tl),
      fromTo: vi.fn(() => tl),
      kill: vi.fn(),
    };
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

import {
  PAGE_COVERED_ATTR,
  PageTransitionProvider,
  SCROLL_CONTAINER_ATTR,
  usePageTransition,
} from "./PageTransitionProvider";

function Trigger({ href }: { href: string }) {
  const transition = usePageTransition();
  return (
    <button type="button" onClick={() => transition?.startTransition(href)}>
      go
    </button>
  );
}

// document.fonts.ready gates the first-load uncover. jsdom has no font
// loading, so stub a resolved promise: the seeded first-load cover lifts
// on the next microtask, leaving the machine idle before each test acts.
let fontsReady: Promise<unknown>;

beforeEach(() => {
  push.mockClear();
  currentPathname = "/";
  mockMatchMediaShouldMatch = false;
  fontsReady = Promise.resolve();
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: { get ready() { return fontsReady; } },
  });
});

// Renders the provider and waits for the seeded first-load cover to lift.
async function renderSettled(ui: Parameters<typeof render>[0]) {
  const result = render(ui);
  await waitFor(() =>
    expect(document.querySelector("[aria-hidden]")?.getAttribute("style")).toContain("visibility: hidden"),
  );
  return result;
}

afterEach(() => {
  vi.useRealTimers();
});

describe("PageTransitionProvider", () => {
  it("renders its children", () => {
    render(
      <PageTransitionProvider>
        <p>page content</p>
      </PageTransitionProvider>,
    );

    expect(screen.getByText("page content")).toBeInTheDocument();
  });

  it("pushes the requested route once the panel has covered the page", async () => {
    const user = userEvent.setup();
    await renderSettled(
      <PageTransitionProvider>
        <Trigger href="/projects/home-hospital" />
      </PageTransitionProvider>,
    );

    await user.click(screen.getByRole("button", { name: "go" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/projects/home-hospital"));
  });

  it("returns to idle so a later navigation runs a fresh transition", async () => {
    const user = userEvent.setup();

    function App() {
      return (
        <PageTransitionProvider>
          <Trigger href={currentPathname === "/" ? "/projects/one" : "/projects/two"} />
        </PageTransitionProvider>
      );
    }

    const { rerender } = await renderSettled(<App />);

    await user.click(screen.getByRole("button", { name: "go" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/projects/one"));

    // Next commits the route; the machine holds, then uncovers back to idle.
    currentPathname = "/projects/one";
    rerender(<App />);
    await new Promise((resolve) => setTimeout(resolve, HOLD_DURATION_MS + 50));

    await user.click(screen.getByRole("button", { name: "go" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/projects/two"));
  });

  it("scrolls the nested scroll container to the top on a forward navigation", async () => {
    const user = userEvent.setup();
    const scrollTo = vi.fn();

    await renderSettled(
      <PageTransitionProvider>
        <div
          {...{ [SCROLL_CONTAINER_ATTR]: "" }}
          ref={(el) => {
            if (el) el.scrollTo = scrollTo;
          }}
        >
          <Trigger href="/projects/home-hospital" />
        </div>
      </PageTransitionProvider>,
    );

    await user.click(screen.getByRole("button", { name: "go" }));

    await waitFor(() => expect(scrollTo).toHaveBeenCalledWith({ top: 0 }));
  });

  it("flags the page as covered while transitioning and clears it once idle", async () => {
    const user = userEvent.setup();
    let sawCovered = false;

    function App() {
      return (
        <PageTransitionProvider>
          <Trigger href="/projects/home-hospital" />
        </PageTransitionProvider>
      );
    }

    const { rerender } = await renderSettled(<App />);

    await user.click(screen.getByRole("button", { name: "go" }));
    await waitFor(() => {
      if (document.documentElement.hasAttribute(PAGE_COVERED_ATTR)) sawCovered = true;
      expect(push).toHaveBeenCalledWith("/projects/home-hospital");
    });

    currentPathname = "/projects/home-hospital";
    rerender(<App />);

    if (document.documentElement.hasAttribute(PAGE_COVERED_ATTR)) sawCovered = true;
    expect(sawCovered).toBe(true);
    await waitFor(() => expect(document.documentElement.hasAttribute(PAGE_COVERED_ATTR)).toBe(false));
  });

  it("renders the overlay opaque on first paint so the page loads covered", () => {
    render(
      <PageTransitionProvider>
        <p>page content</p>
      </PageTransitionProvider>,
    );

    const style = document.querySelector("[aria-hidden]")?.getAttribute("style") ?? "";
    expect(style).toContain("visibility: visible");
    expect(style).toContain("opacity: 1");
    expect(style).toContain("background-color: var(--background)");
    expect(style).toContain("pointer-events: auto");
  });

  it("lifts the first-load cover once, after fonts are ready, with no navigation", async () => {
    render(
      <PageTransitionProvider>
        <Trigger href="/should-not-be-used" />
      </PageTransitionProvider>,
    );

    await waitFor(() =>
      expect(document.querySelector("[aria-hidden]")?.getAttribute("style")).toContain("visibility: hidden"),
    );
    expect(push).not.toHaveBeenCalled();
  });

  it("lifts the first-load cover when the font cap elapses before fonts resolve", async () => {
    fontsReady = new Promise(() => {});

    render(
      <PageTransitionProvider>
        <p>page content</p>
      </PageTransitionProvider>,
    );

    await waitFor(
      () =>
        expect(document.querySelector("[aria-hidden]")?.getAttribute("style")).toContain("visibility: hidden"),
      { timeout: FIRST_LOAD_FONT_CAP_MS + 500 },
    );
  });

  it("uses the opacity-only fade for a reduced-motion first load", async () => {
    mockMatchMediaShouldMatch = true;

    await renderSettled(
      <PageTransitionProvider>
        <p>page content</p>
      </PageTransitionProvider>,
    );

    // The opacity-fade branch still returns the machine to idle: the panel
    // ends hidden and no longer captures pointer events.
    const style = document.querySelector("[aria-hidden]")?.getAttribute("style") ?? "";
    expect(style).toContain("pointer-events: none");
  });

  it("still drives the route change to completion under prefers-reduced-motion", async () => {
    mockMatchMediaShouldMatch = true;
    const user = userEvent.setup();

    function App() {
      return (
        <PageTransitionProvider>
          <Trigger href="/projects/home-hospital" />
        </PageTransitionProvider>
      );
    }

    const { rerender } = await renderSettled(<App />);

    await user.click(screen.getByRole("button", { name: "go" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/projects/home-hospital"));

    // The opacity-only path still commits the route and lifts the panel:
    // once the new pathname is live the overlay stops capturing pointers.
    currentPathname = "/projects/home-hospital";
    rerender(<App />);

    await waitFor(() =>
      expect(document.querySelector("[aria-hidden]")?.getAttribute("style")).toContain("pointer-events: none"),
    );
  });
});
