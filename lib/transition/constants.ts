// Single source of truth for the first-load transition panel's timing and
// easing, shared by PageTransitionProvider's GSAP timeline and its
// reduced-motion fallback. No transition component hardcodes a value.
//
// Route-to-route navigation timing lives elsewhere: the view-transition page
// push is CSS, tokenised in styles/tokens.scss (see
// docs/adr/0014-motion-system.md).

export const UNCOVER_DURATION_MS = 600;
export const CONTENT_RISE_PX = 16;
export const FIRST_LOAD_FONT_CAP_MS = 600;
export const SAFETY_TIMEOUT_MS = 1200;
export const REDUCED_MOTION_FADE_MS = 150;

export const UNCOVER_EASE = "power2.out";
export const CONTENT_RISE_EASE = "power2.out";
