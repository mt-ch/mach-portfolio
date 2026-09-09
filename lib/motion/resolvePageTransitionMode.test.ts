import { describe, expect, it } from "vitest";

import { resolvePageTransitionMode } from "./resolvePageTransitionMode";

const allPermit = {
  prefersReducedMotion: false,
  supportsViewTransitions: true,
  isNarrowViewport: false,
};

describe("resolvePageTransitionMode", () => {
  it("is view-transition only when every condition permits", () => {
    expect(resolvePageTransitionMode(allPermit)).toBe("view-transition");
  });

  it("is instant when the browser has no View Transitions API", () => {
    expect(resolvePageTransitionMode({ ...allPermit, supportsViewTransitions: false })).toBe("instant");
  });

  it("is instant under OS reduce-motion", () => {
    expect(resolvePageTransitionMode({ ...allPermit, prefersReducedMotion: true })).toBe("instant");
  });

  it("is instant on a narrow viewport", () => {
    expect(resolvePageTransitionMode({ ...allPermit, isNarrowViewport: true })).toBe("instant");
  });
});
