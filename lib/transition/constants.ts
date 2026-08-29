// Single source of truth for page-transition timing and easing, shared by
// PageTransitionProvider's GSAP timeline and the reduced-motion fallback.
// No transition component hardcodes a duration or easing value directly.

export const COVER_DURATION_MS = 400;
export const HOLD_DURATION_MS = 100;
export const UNCOVER_DURATION_MS = 600;
export const CONTENT_RISE_PX = 16;
export const FIRST_LOAD_FONT_CAP_MS = 600;
export const SAFETY_TIMEOUT_MS = 1200;
export const REDUCED_MOTION_FADE_MS = 150;

export const COVER_EASE = "power2.in";
export const UNCOVER_EASE = "power2.out";
export const CONTENT_RISE_EASE = "power2.out";
