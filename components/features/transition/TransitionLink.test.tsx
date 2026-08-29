import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const startTransition = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/projects/current",
}));

vi.mock("./PageTransitionProvider", () => ({
  usePageTransition: () => ({ startTransition }),
}));

import { TransitionLink } from "./TransitionLink";

beforeEach(() => {
  startTransition.mockClear();
});

describe("TransitionLink", () => {
  it("renders a real anchor so navigation works without JavaScript", () => {
    render(<TransitionLink href="/projects/next">Next</TransitionLink>);

    expect(screen.getByRole("link", { name: "Next" })).toHaveAttribute("href", "/projects/next");
  });

  it("intercepts a plain click to another in-site path and starts the transition", () => {
    render(<TransitionLink href="/projects/next">Next</TransitionLink>);

    const notCancelled = fireEvent.click(screen.getByRole("link", { name: "Next" }));

    expect(notCancelled).toBe(false);
    expect(startTransition).toHaveBeenCalledWith("/projects/next");
  });

  it("ignores a click to the current path (query/hash-only change) and lets the link behave normally", () => {
    render(
      <TransitionLink href="/projects/current#gallery">Gallery</TransitionLink>,
    );

    const notCancelled = fireEvent.click(screen.getByRole("link", { name: "Gallery" }));

    expect(notCancelled).toBe(true);
    expect(startTransition).not.toHaveBeenCalled();
  });

  it("ignores a bare hash link", () => {
    render(<TransitionLink href="#top">Top</TransitionLink>);

    fireEvent.click(screen.getByRole("link", { name: "Top" }));

    expect(startTransition).not.toHaveBeenCalled();
  });

  it("passes external links straight through", () => {
    render(
      <TransitionLink href="https://example.com">External</TransitionLink>,
    );

    const notCancelled = fireEvent.click(screen.getByRole("link", { name: "External" }));

    expect(notCancelled).toBe(true);
    expect(startTransition).not.toHaveBeenCalled();
  });

  it("passes new-tab links straight through", () => {
    render(
      <TransitionLink href="/projects/next" target="_blank">
        New tab
      </TransitionLink>,
    );

    fireEvent.click(screen.getByRole("link", { name: "New tab" }));

    expect(startTransition).not.toHaveBeenCalled();
  });

  it("ignores modified clicks (new tab / new window intent)", () => {
    render(<TransitionLink href="/projects/next">Next</TransitionLink>);

    fireEvent.click(screen.getByRole("link", { name: "Next" }), { metaKey: true });

    expect(startTransition).not.toHaveBeenCalled();
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
    expect(startTransition).toHaveBeenCalledWith("/projects/next");
  });
});
