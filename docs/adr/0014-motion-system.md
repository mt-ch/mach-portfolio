# Motion system: smooth scroll, scroll reveals, view-transition page push

Issue #224 overhauls how the site loads and moves between pages, modelled on
the page-load and route transitions of the reference site. It ships as three
independently revertable pieces on a shared foundation. This ADR records the
shared model; each section is filled in by the ticket that builds it.

*Numbering note: issues #224 and #225 both anticipated this as `0010`, but
`0010` was taken by the Experience/Roles model before this work started. This
is `0014`; no existing ADR was renumbered.*

## Shared foundation (#225)

**`lib/motion/environment.ts` is the single reader of the motion
environment.** It reports `{ prefersReducedMotion, supportsViewTransitions,
isNarrowViewport }` from `matchMedia` and feature detection, and exposes a
subscription (`useMotionEnvironment` wraps it with `useSyncExternalStore`).
Every motion feature reads its "should this animate, and how" inputs from
here — none call `matchMedia` or feature-detect independently, so the three
features cannot drift in how they detect the environment. The subscription
means an OS change — most importantly toggling "reduce motion" — is picked up
without a reload: consumers re-render, and the effect a feature gates on (the
smooth-scroll instantiation effect; later, the next navigation) sees the new
value.

**`isNarrowViewport` uses a `≤767px` boundary, deliberately distinct from the
chat drawer's `640px` `sm` breakpoint.** 767px is a lower-powered-device
heuristic borrowed from the reference (it switches its route-push animation
off there), not a layout breakpoint. The two boundaries are intentionally
separate; do not unify them.

**Timing and easing are single-sourced.** Motion values not already owned by
`lib/transition/constants.ts` (the first-load panel) live in
`lib/motion/constants.ts`. Nothing hardcodes a duration or easing. Mirrors
`lib/theme`, `lib/transition/constants.ts`, and ADR 0009's `styles/tokens.scss`.

**The two-animation-library split from ADR 0009 is unchanged.** GSAP stays the
engine for imperative timelines on elements that never unmount (the custom
cursor, the first-load panel, and now smooth scroll driving `ScrollTrigger`);
`motion` stays the chat drawer's engine for `AnimatePresence`-driven
enter/exit. Adding `lenis` + `gsap/ScrollTrigger` here is within GSAP's half
of that split, not new drift.

## Smooth scroll (#225)

**Site-wide Lenis-smoothed scrolling, subtle.** `SmoothScrollProvider` is
mounted once in the `(site)` layout — above the route, so it never remounts on
navigation. It binds a core `Lenis` instance (not `ReactLenis`, which
remounts page content when toggled) to the nested `[data-scroll-container]`
element `ChatShell` owns, because `<body>` is `overflow-hidden` and the real
scroller is nested. `wrapper === content` puts Lenis in element-native-scroll
mode: it eases the container's own `scrollTop` rather than transforming a
child, so `scrollTo` on the element and the transition's content-rise tween
keep working.

**`resolveSmoothScroll(env)` is the one decision seam** — pure, returns
`false` only under `prefersReducedMotion`. When it returns `false` no Lenis
instance is created and scrolling is fully native. Touch input stays native
either way; Lenis does not smooth touch (v1.1+).

**The instance drives GSAP.** `lenis.raf` runs on the GSAP ticker (with
`lagSmoothing(0)`), and `lenis.on('scroll', ScrollTrigger.update)` keeps
`ScrollTrigger` in sync with the smoothed position for the scroll-reveal work
that follows. `ScrollTrigger.refresh()` runs after each route commit.

**Feel is a token, tuned by eye.** `SMOOTH_SCROLL_LERP` in
`lib/motion/constants.ts` — run above Lenis's default `lerp` (0.1) so the
scroll only just takes the edge off native input rather than gliding; the
site owner's brief settled on "almost native". Not asserted by any test;
verified manually.

**History.** This reinstates the Lenis integration added in PR #93 and
reverted in PR #94 (feature no longer wanted at the time), now on the shared
`lib/motion/` foundation and wired into `ScrollTrigger`.

## Scroll reveals (#226)

*(#225 anticipated this as the `#228` section and the page push as `#226`; the
two shipped the other way round. This section is the reveal work, built by
#226; the page push below was built by #228.)*

**Below-the-fold content reveals once as it scrolls into view.** Content
Blocks in a Project Story, the homepage sections below the hero
(`WhatIDoSection`, `HowIWorkSection`, `ExperienceSection`, and every
`FeaturedProjectRow` bar the first, which carries the LCP image and must paint
immediately), and `OtherProjects` fade from 0 to full opacity and rise
`REVEAL_RISE_PX` (24) as their top passes `REVEAL_THRESHOLD_RATIO` (0.85) of the
viewport height. Each element reveals once and is unobserved — scrolling back up
and down does not replay it. The project-card grid (`ProjectCard`) is not
mounted in any route today; when a listing page reintroduces it, wrap the grid
in `<Reveal stagger>` the same way `OtherProjects` does.

**`planSectionReveal({ childCount, env })` is the pure decision seam** — in
`lib/motion/revealPlan.ts`, returning `{ enabled, staggerMs, risePx,
thresholdRatio }`. `enabled` is `false` under OS "reduce motion" (nothing is
hidden, all content is simply present). A single element animates as one block
with `staggerMs: 0`; a multi-item group (experience rows, project cards, the
other-projects list) cascades its children by `REVEAL_STAGGER_MS` (80) each.

**`useSectionReveal` is the imperative shell.** It hides the target(s), wires
one `IntersectionObserver` with a bottom root-margin of `-(1 - ratio) * 100%`,
and on intersection drives a CSS transition (`REVEAL_DURATION_MS` 600ms,
`REVEAL_EASE` — `power2.out` expressed as its cubic-bezier equivalent, since
these run as CSS transitions not a GSAP timeline) then unobserves the element.
`stagger` treats the wrapper's direct children as the group. The `Reveal`
client component is the boundary server sections wrap themselves in; it carries
no reveal markup or classes, only the ref.

**Timing and easing are single-sourced** in `lib/motion/constants.ts`
alongside the smooth-scroll token. Nothing hardcodes a duration, distance, or
easing.

## View-transition page push (#228)

*Filled in by #228. This section supersedes the route-transition mechanism of
ADR 0008; ADR 0008's first-load opaque panel, its rationale, and
`TransitionLink` as the single link entry point remain in force.*

## Testing

Behaviour and pure-function decisions only — never markup, class names, or
Lenis/GSAP call shapes. `resolveSmoothScroll` and `lib/motion/environment.ts`
have unit tests (`matchMedia` stubbed); `SmoothScrollProvider` has a
behaviour test with the `Lenis` constructor spied (not constructed under
reduce-motion; constructed and bound to the scroll container otherwise).
`planSectionReveal` has unit tests (`enabled` and `staggerMs` across child
counts and reduced motion); `Reveal` has a behaviour test with
`IntersectionObserver` stubbed — an intersected element ends revealed and is
not re-animated on a second intersection, and under reduced motion no observer
is created and nothing is hidden. The scroll feel, the reveal timing, and the
page push are visual — verified
manually, exactly as the cursor (0007), the page transition (0008), and chat
motion (0009) are.
