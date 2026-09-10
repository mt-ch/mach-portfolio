import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MotionEnvironment } from "@/lib/motion/environment";

const transitionPush = vi.fn();

let env: MotionEnvironment = {
  prefersReducedMotion: false,
  supportsViewTransitions: true,
  isNarrowViewport: false,
};

vi.mock("next/navigation", () => ({
  usePathname: () => "/projects/current",
}));

vi.mock("next-view-transitions", () => ({
  useTransitionRouter: () => ({ push: transitionPush }),
}));

vi.mock("@/lib/motion/environment", () => ({
  useMotionEnvironment: () => env,
}));

import { TransitionLink, resetPushLockForTests } from "./TransitionLink";

beforeEach(() => {
  transitionPush.mockClear();
  resetPushLockForTests();
  env = { prefersReducedMotion: false, supportsViewTransitions: true, isNarrowViewport: false };
});

describe("TransitionLink", () => {
  it("renders a real anchor so navigation works without JavaScript", () => {
    render(<TransitionLink href="/projects/next">Next</TransitionLink>);

    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute("href", "/projects/next");
  });

  it("intercepts a plain in-site left-click and runs the view-transition navigation", () => {
    render(<TransitionLink href="/projects/next">Next</TransitionLink>);

    const notCancelled = fireEvent.click(screen.getByRole("link", { name: "Next" }));

    expect(notCancelled).toBe(false);
    expect(transitionPush).toHaveBeenCalledWith("/projects/next");
  });

  it("does not start a second view transition while one is in flight", () => {
    render(
      <>
        <TransitionLink href="/projects/a">A</TransitionLink>
        <TransitionLink href="/projects/b">B</TransitionLink>
      </>,
    );

    const first = fireEvent.click(screen.getByRole("link", { name: "A" }));
    const second = fireEvent.click(screen.getByRole("link", { name: "B" }));

    expect(first).toBe(false); // first click intercepted
    expect(second).toBe(true); // second falls through to a plain navigation
    expect(transitionPush).toHaveBeenCalledTimes(1);
    expect(transitionPush).toHaveBeenCalledWith("/projects/a");
  });

  it("lets next/link handle the navigation with no view transition when the mode is instant", () => {
    env = { prefersReducedMotion: false, supportsViewTransitions: true, isNarrowViewport: true };
    render(<TransitionLink href="/projects/next">Next</TransitionLink>);

    const notCancelled = fireEvent.click(screen.getByRole("link", { name: "Next" }));

    expect(notCancelled).toBe(true);
    expect(transitionPush).not.toHaveBeenCalled();
  });

  it("ignores a click to the current path (query/hash-only change)", () => {
    render(<TransitionLink href="/projects/current#gallery">Gallery</TransitionLink>);

    const notCancelled = fireEvent.click(screen.getByRole("link", { name: "Gallery" }));

    expect(notCancelled).toBe(true);
    expect(transitionPush).not.toHaveBeenCalled();
  });

  it("ignores a bare hash link", () => {
    render(<TransitionLink href="#top">Top</TransitionLink>);

    fireEvent.click(screen.getByRole("link", { name: "Top" }));

    expect(transitionPush).not.toHaveBeenCalled();
  });

  it("passes external links straight through", () => {
    render(<TransitionLink href="https://example.com">External</TransitionLink>);

    const notCancelled = fireEvent.click(screen.getByRole("link", { name: "External" }));

    expect(notCancelled).toBe(true);
    expect(transitionPush).not.toHaveBeenCalled();
  });

  it("passes new-tab links straight through", () => {
    render(
      <TransitionLink href="/projects/next" target="_blank">
        New tab
      </TransitionLink>,
    );

    fireEvent.click(screen.getByRole("link", { name: "New tab" }));

    expect(transitionPush).not.toHaveBeenCalled();
  });

  it("ignores modified clicks (new tab / new window intent)", () => {
    render(<TransitionLink href="/projects/next">Next</TransitionLink>);

    fireEvent.click(screen.getByRole("link", { name: "Next" }), { metaKey: true });

    expect(transitionPush).not.toHaveBeenCalled();
  });

  it("still runs a caller-supplied onClick handler", () => {
    const onClick = vi.fn();
    render(
      <TransitionLink href="/projects/next" onClick={onClick}>
        Next
      </TransitionLink>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Next" }));

    expect(onClick).toHaveBeenCalledOnce();
    expect(transitionPush).toHaveBeenCalledWith("/projects/next");
  });
});
