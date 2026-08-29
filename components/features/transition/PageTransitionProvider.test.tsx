import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HOLD_DURATION_MS } from "@/lib/transition/constants";

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

beforeEach(() => {
  push.mockClear();
  currentPathname = "/";
  mockMatchMediaShouldMatch = false;
});

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
    render(
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

    const { rerender } = render(<App />);

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

    render(
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

    const { rerender } = render(<App />);

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

    const { rerender } = render(<App />);

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
