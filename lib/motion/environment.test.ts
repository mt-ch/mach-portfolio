import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NARROW_VIEWPORT_QUERY, REDUCED_MOTION_QUERY } from "./constants";
import { readMotionEnvironment, subscribeMotionEnvironment } from "./environment";

// A minimal controllable matchMedia: each query string gets a fake
// MediaQueryList whose `matches` can be flipped and a `change` event
// dispatched to registered listeners.
class FakeMediaQueryList {
  matches = false;
  private listeners = new Set<() => void>();

  constructor(public media: string) {}

  addEventListener(_type: "change", listener: () => void) {
    this.listeners.add(listener);
  }

  removeEventListener(_type: "change", listener: () => void) {
    this.listeners.delete(listener);
  }

  set(matches: boolean) {
    if (this.matches === matches) return;
    this.matches = matches;
    for (const listener of this.listeners) listener();
  }
}

let queries: Map<string, FakeMediaQueryList>;

function mq(query: string): FakeMediaQueryList {
  const existing = queries.get(query);
  if (existing) return existing;
  const created = new FakeMediaQueryList(query);
  queries.set(query, created);
  return created;
}

beforeEach(() => {
  queries = new Map();
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => mq(query)),
  );
  // Feature-detect target for supportsViewTransitions.
  delete (document as { startViewTransition?: unknown }).startViewTransition;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("readMotionEnvironment", () => {
  it("reports every flag false by default", () => {
    // A no-op subscription forces a fresh read against the current stubs.
    const unsubscribe = subscribeMotionEnvironment(() => {});
    expect(readMotionEnvironment()).toEqual({
      prefersReducedMotion: false,
      supportsViewTransitions: false,
      isNarrowViewport: false,
    });
    unsubscribe();
  });

  it("reports reduced motion and narrow viewport when both media queries match", () => {
    mq(REDUCED_MOTION_QUERY).matches = true;
    mq(NARROW_VIEWPORT_QUERY).matches = true;

    const unsubscribe = subscribeMotionEnvironment(() => {});
    expect(readMotionEnvironment()).toMatchObject({
      prefersReducedMotion: true,
      isNarrowViewport: true,
    });
    unsubscribe();
  });

  it("reports View Transitions support from feature detection", () => {
    (document as { startViewTransition?: unknown }).startViewTransition = () => {};

    const unsubscribe = subscribeMotionEnvironment(() => {});
    expect(readMotionEnvironment().supportsViewTransitions).toBe(true);
    unsubscribe();
  });
});

describe("subscribeMotionEnvironment", () => {
  it("notifies subscribers when the OS reduced-motion setting changes", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeMotionEnvironment(listener);

    expect(readMotionEnvironment().prefersReducedMotion).toBe(false);

    mq(REDUCED_MOTION_QUERY).set(true);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(readMotionEnvironment().prefersReducedMotion).toBe(true);

    mq(REDUCED_MOTION_QUERY).set(false);

    expect(listener).toHaveBeenCalledTimes(2);
    expect(readMotionEnvironment().prefersReducedMotion).toBe(false);

    unsubscribe();
  });

  it("stops notifying after unsubscribe", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeMotionEnvironment(listener);
    unsubscribe();

    mq(REDUCED_MOTION_QUERY).set(true);

    expect(listener).not.toHaveBeenCalled();
  });
});
