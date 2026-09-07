import type { MotionEnvironment } from "./environment";

/**
 * Whether a Lenis smooth-scroll instance should exist at all.
 *
 * Pure: the one decision seam for the smooth-scroll feature. Returns `false`
 * only under OS "reduce motion" — then no Lenis instance is created and
 * scrolling is fully native. Touch input is left native by Lenis itself
 * (v1.1+ does not smooth touch), so it is not a branch here.
 */
export function resolveSmoothScroll(env: Pick<MotionEnvironment, "prefersReducedMotion">): boolean {
  return !env.prefersReducedMotion;
}
