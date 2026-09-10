import type { MotionEnvironment } from "./environment";

/** How a route-to-route navigation should be presented. */
export type PageTransitionMode = "view-transition" | "instant";

/**
 * The one decision seam for the view-transition page push. Pure.
 *
 * Returns `"instant"` (a clean route swap, no slide or fade) when any of:
 * - the browser has no View Transitions API (e.g. Firefox),
 * - the visitor has set OS "reduce motion",
 * - the viewport is at or below the `≤767px` motion boundary.
 *
 * `"view-transition"` only when every one of those permits the animation.
 */
export function resolvePageTransitionMode(
  env: Pick<MotionEnvironment, "prefersReducedMotion" | "supportsViewTransitions" | "isNarrowViewport">,
): PageTransitionMode {
  if (!env.supportsViewTransitions || env.prefersReducedMotion || env.isNarrowViewport) {
    return "instant";
  }
  return "view-transition";
}
