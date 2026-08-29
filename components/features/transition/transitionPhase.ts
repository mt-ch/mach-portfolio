// Framework-free decision core for the page-transition system: no React,
// GSAP, or DOM globals. PageTransitionProvider drives this reducer and
// acts on its intent flags; it owns all animation and timing itself.

export type TransitionPhase = "idle" | "covering" | "covered" | "uncovering";

// Which kind of navigation opened the current covered/uncovering sequence.
// Carried until the machine returns to idle so shouldResetScroll can stay
// correct for every event on the path, not just the one that started it.
type TransitionPath = "nav" | "popstate" | "firstload" | null;

export interface TransitionState {
  phase: TransitionPhase;
  path: TransitionPath;
}

export type TransitionEvent =
  | { type: "NAV_REQUESTED" }
  | { type: "POPSTATE" }
  | { type: "COVER_DONE" }
  | { type: "ROUTE_COMMITTED" }
  | { type: "UNCOVER_DONE" }
  | { type: "SAFETY_TIMEOUT" }
  | { type: "FIRST_LOAD_READY" };

export interface TransitionResult {
  state: TransitionState;
  shouldResetScroll: boolean;
  shouldFadeCursor: boolean;
}

export const initialTransitionState: TransitionState = { phase: "idle", path: null };

// Seed for a fresh page load: the machine starts already `covered` (path
// `firstload`) so the server-rendered overlay is accounted for before any
// JavaScript runs. After hydration the provider dispatches ROUTE_COMMITTED
// once — gated on fonts being ready — to lift it.
export const firstLoadTransitionResult: TransitionResult = transitionPhase(initialTransitionState, {
  type: "FIRST_LOAD_READY",
});

function nextPhase(state: TransitionState, event: TransitionEvent): TransitionState {
  switch (event.type) {
    case "NAV_REQUESTED":
      return state.phase === "idle" ? { phase: "covering", path: "nav" } : state;

    case "POPSTATE":
      return { phase: "covered", path: "popstate" };

    case "FIRST_LOAD_READY":
      return { phase: "covered", path: "firstload" };

    case "COVER_DONE":
      return state.phase === "covering" ? { phase: "covered", path: state.path } : state;

    case "ROUTE_COMMITTED":
      return state.phase === "covered" ? { phase: "uncovering", path: state.path } : state;

    case "UNCOVER_DONE":
      return state.phase === "uncovering" ? { phase: "idle", path: null } : state;

    case "SAFETY_TIMEOUT":
      if (state.phase === "covering" || state.phase === "covered") {
        return { phase: "uncovering", path: state.path };
      }
      // Last-resort net: if the uncover animation's completion callback
      // never fires, force back to idle so the cursor reappears and later
      // navigations are not permanently dead.
      if (state.phase === "uncovering") {
        return { phase: "idle", path: null };
      }
      return state;

    default:
      return state;
  }
}

export function transitionPhase(state: TransitionState, event: TransitionEvent): TransitionResult {
  const next = nextPhase(state, event);

  return {
    state: next,
    shouldResetScroll: next.path === "nav",
    // Faded for the whole covered stretch — from the moment the panel
    // starts covering until it has fully lifted and the machine is idle
    // again — so the cursor is never visible over the opaque panel.
    shouldFadeCursor: next.phase !== "idle",
  };
}
