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
      return state.phase === "covering" || state.phase === "covered"
        ? { phase: "uncovering", path: state.path }
        : state;

    default:
      return state;
  }
}

export function transitionPhase(state: TransitionState, event: TransitionEvent): TransitionResult {
  const next = nextPhase(state, event);

  return {
    state: next,
    shouldResetScroll: next.path === "nav",
    shouldFadeCursor: next.phase === "covered",
  };
}
