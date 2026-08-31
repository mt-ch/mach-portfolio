# Chat motion conventions

Issues #133–#138 add enter/exit motion to the chat drawer — panel presence, the
message stream, the landing↔conversation swap, and the composer's height ease.
Six small PRs, one shared set of rules so future chat work stays coherent.

**`motion` is the library for React-orchestrated enter/exit; `gsap` stays for the
cursor.** `motion` (v13, the `motion/react` entry) owns anything that needs
`AnimatePresence`, `useReducedMotion`, or variant/`custom` propagation — i.e. the
chat drawer and its contents. `gsap` remains the custom cursor's and the page
transition overlay's engine (see `0007`, `0008`); those are imperative timeline
animations on elements that never unmount, and there was no reason to port them.
Two animation libraries is a deliberate, bounded split, not drift.

**Motion tokens are the only source of timing.** Durations and easings live once
in `styles/tokens.scss`, following the existing two-layer pattern (bare custom
properties on `:root`, restated in the `@theme` bridge):

- `--duration-fast: 150ms` — utility acknowledgements, crossfades, reduced-motion
  substitute, composer height ease.
- `--duration-base: 220ms` — the default for a visible enter/exit (message
  entrance, landing→conversation dissolve).
- `--duration-slow: 300ms` — the drawer shell itself; deliberately equal to the
  old `TRANSITION_MS` drawer constant.
- `--duration-hero: 420ms` — reserved, currently unused. If a chat animation ever
  seems to want it, that is the signal to stop and reconsider (see restraint,
  below).
- `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)` — every chat entrance and exit.
- `--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1)` — symmetric moves.

CSS transitions reference the tokens directly; JS reads them at runtime
(`motionTiming.ts` / `messageMotion.ts` parse `getComputedStyle` values, with the
literal fallbacks only for SSR and jsdom) so a JS unmount delay and its CSS
transition can never drift apart. No chat component hardcodes a duration or
easing. This mirrors `lib/transition/constants.ts` and `lib/theme` — the feel is
retuned from one file.

**Restraint is the governing principle.** Chat motion exists to keep the reader
oriented while content changes, nothing more:

- **No hero moment.** No entrance the eye is meant to watch. `--duration-hero`
  stays unused.
- **No decorative stagger.** Message entrances animate independently; a restored
  history settles to its final state on open rather than cascading in.
- **No spring overshoot in the message stream.** Every transition is a fixed-
  duration ease-out. Springs read as playful; the stream is a reading surface.
- **Opacity first, small translate at most.** Message entrance is an 8px rise and
  a fade; the landing↔conversation swap is a pure opacity dissolve with *no*
  translate, because the two layouts anchor to opposite edges and any slide would
  make them appear to move past each other.

**Reduced motion: short fades, zero movement, OS preference only.** Every chat
animation has a reduced-motion branch keyed on `useReducedMotion()` (React) or
`motion-reduce:` / `@media (prefers-reduced-motion: reduce)` (CSS) — the OS
setting is the only input, there is no in-app toggle. When it matches: all
translate goes to `0`, every duration collapses to `--duration-fast`, and
height/position changes snap. The animation still *happens* as an opacity change
so presence and swaps stay legible; it just carries no motion. Same structure as
the page transition's reduced-motion branch (`0008`).

**`useTransitionPhase` is retired in favour of `AnimatePresence`.** The chat
drawer used to drive its own mount lifecycle with a bespoke `useTransitionPhase`
hook and a `TRANSITION_MS` constant, exposing `isMounted` / `isVisible` props
that the shell had to thread through. That hook and constant are deleted. The
drawer now renders inside `<AnimatePresence>` and keeps itself mounted through
its exit animation via `usePresence`; the shell learns when the panel has fully
left through `onExitComplete`. Presence is the framework's job now, not a prop
contract between shell and drawer.

**Testing is unchanged from the repo norm — behaviour, not markup.**
`MotionGlobalConfig.skipAnimations` is set in `vitest.setup.ts` so `motion`
renders resolve straight to their final state; tests then assert what the visitor
ends up seeing (a message is present, the landing pane is gone, the drawer
unmounts after close) exactly as the pre-motion suite did. Animation timing and
the visual feel of each transition are verified manually, consistent with
`CONTEXT.md` and with how the cursor and page transition are tested.
