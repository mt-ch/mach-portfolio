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

// Reveal-on-scroll for below-the-fold sections (#226). A section fades from 0
// to 1 opacity and rises REVEAL_RISE_PX over REVEAL_DURATION_MS. The brief
// calls for `power2.out`; these reveals run as CSS transitions rather than a
// GSAP timeline, so the easing is expressed as its cubic-bezier equivalent
// (ease-out cubic, which is what GSAP's `power2.out` is). See
// docs/adr/0014-motion-system.md.
export const REVEAL_RISE_PX = 24;
export const REVEAL_DURATION_MS = 600;
export const REVEAL_EASE = "cubic-bezier(0.215, 0.61, 0.355, 1)";

// Multi-item groups (experience rows, project cards, the other-projects list)
// cascade their children by this much; single elements animate as one block.
export const REVEAL_STAGGER_MS = 80;

// A section reveals when its top passes this fraction of the viewport height —
// i.e. an IntersectionObserver bottom root-margin of -(1 - ratio) * 100%.
export const REVEAL_THRESHOLD_RATIO = 0.85;

// How long the view-transition page push runs. The animation itself is
// CSS — `--page-push-duration` in styles/tokens.scss — and this value MUST
// match it. It is mirrored here only so `TransitionLink` can hold a lock
// for the length of a push: a second navigation fired mid-transition would
// start an overlapping `startViewTransition`, which the browser aborts with
// `InvalidStateError` and can leave the router wedged. While the lock is up
// further navigations run instantly (no snapshot), which is also the nicer
// behaviour for someone clicking quickly through the site.
export const PAGE_PUSH_DURATION_MS = 1200;
