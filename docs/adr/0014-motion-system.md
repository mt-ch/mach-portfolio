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

## Scroll reveals and heading reveal (#228)

*Filled in by #228.*

## View-transition page push (#228)

*Delivered by issue #228 (the spec's PR 3). This section supersedes the
route-transition mechanism of ADR 0008; ADR 0008's first-load opaque panel,
its rationale, and `TransitionLink` as the single link entry point remain in
force.*

**Route-to-route navigation is a native CSS View Transition, not the overlay
panel.** Navigating pushes the incoming page up over the outgoing one: the
new page slides `translateY(100% → 0)` while the old page drifts
`translateY(0 → -15vh)` and dims `opacity(1 → 0.5)` into a dark scrim shown
in both themes. ~800ms, `cubic-bezier(0.5, 0.55, 0, 1)`, no `clip-path`. The
whole page — nav, `ThemeToggle`, the Ask launcher — rides the default `root`
snapshot and moves as one plane; none of them take a per-element
`view-transition-name`. **This reverses ADR 0008's z-index arrangement that
held the chrome stationary above the panel.** The `::view-transition-*` rules
and their tokens (`--page-push-*`) live in `app/globals.scss` /
`styles/tokens.scss`; the feel is verified manually, as with the cursor
(0007) and the old transition (0008).

**Mechanism: `next-view-transitions`.** Its `<ViewTransitions>` provider
(mounted in the `(site)` layout) and `useTransitionRouter` solve the
App-Router timing problem — the snapshot is taken after React commits the new
route. `TransitionLink` is rewritten to delegate an eligible click to
`useTransitionRouter().push`; its click-eligibility rules are unchanged from
ADR 0008 (plain in-site left-click to a different path transitions; external
/ new-tab / modified / hash-only fall through). It proved compatible with
Next 16 / React 19, so the `unstable_ViewTransition` fallback the spec allowed
for was not needed.

**`resolvePageTransitionMode(env)` → `"view-transition" | "instant"`** is the
one new pure seam (`lib/motion/resolvePageTransitionMode.ts`). `"instant"`
when any of: no View Transitions support (e.g. Firefox), `prefersReducedMotion`,
or `isNarrowViewport` (≤767px). In `"instant"` mode `TransitionLink` leaves
the click to `next/link`'s own client navigation — no snapshot. `popstate`
navigations are captured by `next-view-transitions` regardless of mode, so a
`@media (prefers-reduced-motion: reduce), (max-width: 767px)` block in
`globals.scss` neutralises the `::view-transition` animation to a clean swap
for the same conditions.

**One push at a time.** Starting a second `startViewTransition` before the
first settles makes the browser abort it with `InvalidStateError`, and
`next-view-transitions` does not guard against this — an aborted transition
can leave the router wedged so a later navigation silently does nothing or
lands without its scroll reset. `TransitionLink` therefore holds a shared
lock for the length of a push (`PAGE_PUSH_DURATION_MS`, mirrored from the
CSS token); clicks during that window fall through to `next/link`'s instant
navigation, which is also the better feel for someone clicking quickly.

**`transitionPhase.ts` shrank to the `firstload` path.** The `nav` and
`popstate` cover/uncover sequences, the `covering` phase, the
`TransitionPath` discriminant, and `shouldResetScroll` are gone.
`PageTransitionProvider` lost its forward-nav and popstate machinery and
keeps only the server-opaque first-load panel (`z-[5]`, fonts-gated lift).
The reducer stays the one decision core for what remains.

**Scroll reset.** The nested `[data-scroll-container]` reset to top lives in
`RouteScrollReset`, a layout-level client component whose `useLayoutEffect`
runs inside `next-view-transitions`' transition — the same React commit that
renders the new route, before the new-state snapshot is taken. If it ran
outside that window the "old" snapshot would capture the wrong scroll offset
and the push would visibly jump. Two complications it has to handle:
Next skips its own scroll handling entirely when a navigation reuses route
segments from the client cache (returning to a page visited earlier), and
Lenis eases `scrollTop` on its own RAF loop so a raw `scrollTo` issued
mid-momentum is overwritten a frame later. So `RouteScrollReset` drives
Lenis directly when it is running (`SmoothScrollProvider` exposes the
instance via `getSmoothScroll()`) and re-asserts for a few frames to outlast
Lenis and Next's post-navigation `focus()` / `scrollIntoView()`. `popstate`
skips the reset so the browser's scroll restoration stands, matching ADR
0008; `SmoothScrollProvider` still syncs Lenis to the restored offset on
back/forward.

**Chat drawer exclusion (dormant).** ADR 0013 has Ask disabled, so there is
no drawer to handle now. On the re-enable path: an open drawer must take its
own `view-transition-name` (e.g. `chat-drawer`) with no transition rule, so
it holds static while the page pushes behind it; its backdrop scrim, if any,
holds with it. This is a documented constraint only — nothing is built or
tested for it here.

## Testing

Behaviour and pure-function decisions only — never markup, class names, or
Lenis/GSAP call shapes. `resolveSmoothScroll` and `lib/motion/environment.ts`
have unit tests (`matchMedia` stubbed); `SmoothScrollProvider` has a
behaviour test with the `Lenis` constructor spied (not constructed under
reduce-motion; constructed and bound to the scroll container otherwise).
`resolvePageTransitionMode` has pure unit tests (`"instant"` for each of the
three conditions in isolation, `"view-transition"` only when all permit);
`transitionPhase` and `TransitionLink` keep their reducer / behaviour tests,
cut down to what survives the shrink. The `::view-transition-*` CSS, the
parallax/dim amounts, the scroll feel, the reveal timing, and cursor
behaviour during the push are visual — verified manually, exactly as the
cursor (0007), the page transition (0008), and chat motion (0009) are.
