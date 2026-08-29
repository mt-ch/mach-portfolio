import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HOLD_DURATION_MS } from "@/lib/transition/constants";

const push = vi.fn();
let currentPathname = "/";

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
  return { default: { to, set: vi.fn(), timeline } };
});

vi.mock("@gsap/react", () => ({
  useGSAP: (callback: () => void | (() => void), options?: { dependencies?: unknown[] }) => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => callback(), options?.dependencies ?? []);
  },
}));

import { PageTransitionProvider, SCROLL_CONTAINER_ATTR, usePageTransition } from "./PageTransitionProvider";

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
});
