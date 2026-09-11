import {
  REVEAL_DURATION_MS,
  REVEAL_EASE,
  REVEAL_RISE_PX,
  REVEAL_STAGGER_MS,
  REVEAL_THRESHOLD_RATIO,
} from "./constants";
import type { MotionEnvironment } from "./environment";

export interface SectionRevealPlan {
  /** Whether the reveal animates at all. `false` under OS "reduce motion". */
  enabled: boolean;
  /** Per-child delay for a multi-item group; `0` for a single element. */
  staggerMs: number;
  /** How far, in px, the content rises into place. */
  risePx: number;
  /** How long the fade/rise runs, in ms. */
  durationMs: number;
  /** The transition easing (a CSS timing function). */
  ease: string;
  /** Viewport-height fraction the section's top crosses before it reveals. */
  thresholdRatio: number;
}

/**
 * The pure decision seam for reveal-on-scroll (#226). Given how many items a
 * section reveals and the motion environment, returns whether to animate and
 * the timing to animate with. The IntersectionObserver wiring is the
 * imperative shell around this — see `useSectionReveal`.
 *
 * A single element (`childCount <= 1`) animates as one block with no stagger.
 * A multi-item group cascades its children by `REVEAL_STAGGER_MS` each. Under
 * reduced motion nothing animates and content is simply present.
 */
export function planSectionReveal({
  childCount,
  env,
}: {
  childCount: number;
  env: Pick<MotionEnvironment, "prefersReducedMotion">;
}): SectionRevealPlan {
  const enabled = !env.prefersReducedMotion;

  return {
    enabled,
    staggerMs: enabled && childCount > 1 ? REVEAL_STAGGER_MS : 0,
    risePx: REVEAL_RISE_PX,
    durationMs: REVEAL_DURATION_MS,
    ease: REVEAL_EASE,
    thresholdRatio: REVEAL_THRESHOLD_RATIO,
  };
}
