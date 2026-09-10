// Single source of truth for motion-system timing and easing that is not
// already owned by lib/transition/constants.ts (the page-transition panel).
// Smooth-scroll feel is retuned from here and nowhere else; no component
// hardcodes a duration or easing. Mirrors lib/theme and lib/transition.

// Lenis `lerp`: the fraction of the remaining distance closed each frame.
// Higher = less smoothing. Lenis's default is 0.1; we run higher so the
// scroll only just takes the edge off native input rather than gliding —
// the site owner's call is "almost native". Tuned by eye — see
// docs/adr/0014-motion-system.md.
export const SMOOTH_SCROLL_LERP = 0.2;

// The narrow-viewport boundary the motion system uses, deliberately
// distinct from the chat drawer's 640px `sm` breakpoint: the reference
// design switches its route-push animation off at 767px, a lower-powered
// device heuristic rather than a layout breakpoint. Documented as
// intentional in docs/adr/0014-motion-system.md.
export const NARROW_VIEWPORT_QUERY = "(max-width: 767px)";

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

// How long the view-transition page push runs. The animation itself is
// CSS — `--page-push-duration` in styles/tokens.scss — and this value MUST
// match it. It is mirrored here only so `TransitionLink` can hold a lock
// for the length of a push: a second navigation fired mid-transition would
// start an overlapping `startViewTransition`, which the browser aborts with
// `InvalidStateError` and can leave the router wedged. While the lock is up
// further navigations run instantly (no snapshot), which is also the nicer
// behaviour for someone clicking quickly through the site.
export const PAGE_PUSH_DURATION_MS = 800;
