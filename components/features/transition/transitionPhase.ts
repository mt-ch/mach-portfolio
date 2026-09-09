// Framework-free decision core for the first-load transition panel: no React,
// GSAP, or DOM globals. PageTransitionProvider drives this reducer and acts
// on its intent flag; it owns all animation and timing itself.
//
// Route-to-route navigation no longer runs through here — the view-transition
// page push (docs/adr/0014-motion-system.md) is a native CSS View Transition
// with no reducer state. This machine is reduced to the one path that
// survives: the server-opaque first-load panel and its fonts-gated lift,
// plus the safety net over that.

export type TransitionPhase = "idle" | "covered" | "uncovering";

export interface TransitionState {
  phase: TransitionPhase;
}

export type TransitionEvent =
  | { type: "FIRST_LOAD_READY" }
  | { type: "ROUTE_COMMITTED" }
  | { type: "UNCOVER_DONE" }
  | { type: "SAFETY_TIMEOUT" };

export interface TransitionResult {
  state: TransitionState;
  shouldFadeCursor: boolean;
}

export const initialTransitionState: TransitionState = { phase: "idle" };

// Seed for a fresh page load: the machine starts already `covered` so the
// server-rendered overlay is accounted for before any JavaScript runs. After
// hydration the provider dispatches ROUTE_COMMITTED once — gated on fonts
// being ready — to lift it.
export const firstLoadTransitionResult: TransitionResult = transitionPhase(initialTransitionState, {
  type: "FIRST_LOAD_READY",
});

function nextPhase(state: TransitionState, event: TransitionEvent): TransitionState {
  switch (event.type) {
    case "FIRST_LOAD_READY":
      return { phase: "covered" };

    case "ROUTE_COMMITTED":
      return state.phase === "covered" ? { phase: "uncovering" } : state;

    case "UNCOVER_DONE":
      return state.phase === "uncovering" ? { phase: "idle" } : state;

    case "SAFETY_TIMEOUT":
      if (state.phase === "covered") return { phase: "uncovering" };
      // Last-resort net: if the uncover animation's completion callback never
      // fires, force back to idle so the cursor reappears.
      if (state.phase === "uncovering") return { phase: "idle" };
      return state;

    default:
      return state;
  }
}

export function transitionPhase(state: TransitionState, event: TransitionEvent): TransitionResult {
  const next = nextPhase(state, event);

  return {
    state: next,
    // Faded for the whole covered stretch — from first paint until the panel
    // has fully lifted and the machine is idle again — so the cursor is never
    // visible alone over the opaque panel.
    shouldFadeCursor: next.phase !== "idle",
  };
}
