import { describe, expect, it } from "vitest";

import { resolveSmoothScroll } from "./resolveSmoothScroll";

describe("resolveSmoothScroll", () => {
  it("is disabled under OS reduce-motion", () => {
    expect(resolveSmoothScroll({ prefersReducedMotion: true })).toBe(false);
  });

  it("is enabled when reduce-motion is off", () => {
    expect(resolveSmoothScroll({ prefersReducedMotion: false })).toBe(true);
  });
});
