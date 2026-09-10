import { describe, expect, it } from "vitest";

import {
  REVEAL_DURATION_MS,
  REVEAL_EASE,
  REVEAL_RISE_PX,
  REVEAL_STAGGER_MS,
  REVEAL_THRESHOLD_RATIO,
} from "./constants";
import { planSectionReveal } from "./revealPlan";

const MOVING = { prefersReducedMotion: false };
const REDUCED = { prefersReducedMotion: true };

describe("planSectionReveal", () => {
  it("is disabled under OS reduce-motion, whatever the child count", () => {
    expect(planSectionReveal({ childCount: 1, env: REDUCED }).enabled).toBe(false);
    expect(planSectionReveal({ childCount: 5, env: REDUCED }).enabled).toBe(false);
  });

  it("is enabled when reduce-motion is off", () => {
    expect(planSectionReveal({ childCount: 1, env: MOVING }).enabled).toBe(true);
  });

  it("has no stagger for a single element", () => {
    expect(planSectionReveal({ childCount: 1, env: MOVING }).staggerMs).toBe(0);
    expect(planSectionReveal({ childCount: 0, env: MOVING }).staggerMs).toBe(0);
  });

  it("staggers a multi-item group by a fixed per-child delay", () => {
    expect(planSectionReveal({ childCount: 2, env: MOVING }).staggerMs).toBe(
      REVEAL_STAGGER_MS,
    );
    expect(planSectionReveal({ childCount: 9, env: MOVING }).staggerMs).toBe(
      REVEAL_STAGGER_MS,
    );
  });

  it("never staggers under reduced motion, even for many children", () => {
    expect(planSectionReveal({ childCount: 9, env: REDUCED }).staggerMs).toBe(0);
  });

  it("carries the rise, threshold, and animation timing tokens", () => {
    const plan = planSectionReveal({ childCount: 3, env: MOVING });
    expect(plan.risePx).toBe(REVEAL_RISE_PX);
    expect(plan.thresholdRatio).toBe(REVEAL_THRESHOLD_RATIO);
    expect(plan.durationMs).toBe(REVEAL_DURATION_MS);
    expect(plan.ease).toBe(REVEAL_EASE);
  });
});
