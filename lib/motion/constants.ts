// Single source of truth for motion-system timing and easing that is not
// already owned by lib/transition/constants.ts (the page-transition panel).
// Smooth-scroll feel is retuned from here and nowhere else; no component
// hardcodes a duration or easing. Mirrors lib/theme and lib/transition.

// Lenis is left on its own defaults with one small nudge above them: a
// slightly longer settle than the library default so the scroll reads as
// considered rather than 1:1, still subtle enough not to feel floaty.
// Tuned by eye — see docs/adr/0014-motion-system.md.
export const SMOOTH_SCROLL_DURATION_S = 1.05;

// Ease-out cubic: quick to respond, gentle to rest. Paired with
// SMOOTH_SCROLL_DURATION_S as Lenis's `duration`/`easing`.
export const smoothScrollEasing = (t: number): number => 1 - Math.pow(1 - t, 3);

// The narrow-viewport boundary the motion system uses, deliberately
// distinct from the chat drawer's 640px `sm` breakpoint: the reference
// design switches its route-push animation off at 767px, a lower-powered
// device heuristic rather than a layout breakpoint. Documented as
// intentional in docs/adr/0014-motion-system.md.
export const NARROW_VIEWPORT_QUERY = "(max-width: 767px)";

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
