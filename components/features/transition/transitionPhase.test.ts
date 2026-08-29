import { describe, expect, it } from "vitest";

import { initialTransitionState, transitionPhase } from "./transitionPhase";
import type { TransitionState } from "./transitionPhase";

function run(events: Array<Parameters<typeof transitionPhase>[1]>) {
  let state = initialTransitionState;
  const results = events.map((event) => {
    const result = transitionPhase(state, event);
    state = result.state;
    return result;
  });
  return results;
}

describe("transitionPhase", () => {
  it("drives idle -> covering -> covered -> uncovering -> idle on forward navigation", () => {
    const results = run([
      { type: "NAV_REQUESTED" },
      { type: "COVER_DONE" },
      { type: "ROUTE_COMMITTED" },
      { type: "UNCOVER_DONE" },
    ]);

    expect(results.map((r) => r.state.phase)).toEqual(["covering", "covered", "uncovering", "idle"]);
  });

  it("drives covered -> uncovering -> idle on browser back/forward", () => {
    const results = run([{ type: "POPSTATE" }, { type: "ROUTE_COMMITTED" }, { type: "UNCOVER_DONE" }]);

    expect(results.map((r) => r.state.phase)).toEqual(["covered", "uncovering", "idle"]);
  });

  it("drives covered -> uncovering -> idle on first load", () => {
    const results = run([{ type: "FIRST_LOAD_READY" }, { type: "ROUTE_COMMITTED" }, { type: "UNCOVER_DONE" }]);

    expect(results.map((r) => r.state.phase)).toEqual(["covered", "uncovering", "idle"]);
  });

  it("terminates at idle when SAFETY_TIMEOUT fires while covering", () => {
    const results = run([{ type: "NAV_REQUESTED" }, { type: "SAFETY_TIMEOUT" }, { type: "UNCOVER_DONE" }]);

    expect(results.map((r) => r.state.phase)).toEqual(["covering", "uncovering", "idle"]);
  });

  it("terminates at idle when SAFETY_TIMEOUT fires while covered", () => {
    const results = run([
      { type: "NAV_REQUESTED" },
      { type: "COVER_DONE" },
      { type: "SAFETY_TIMEOUT" },
      { type: "UNCOVER_DONE" },
    ]);

    expect(results.map((r) => r.state.phase)).toEqual(["covering", "covered", "uncovering", "idle"]);
  });

  it("ignores SAFETY_TIMEOUT while idle or uncovering", () => {
    const idleResult = transitionPhase(initialTransitionState, { type: "SAFETY_TIMEOUT" });
    expect(idleResult.state.phase).toBe("idle");

    const results = run([
      { type: "NAV_REQUESTED" },
      { type: "COVER_DONE" },
      { type: "ROUTE_COMMITTED" },
      { type: "SAFETY_TIMEOUT" },
    ]);
    expect(results.at(-1)?.state.phase).toBe("uncovering");
  });

  it("ignores NAV_REQUESTED unless idle", () => {
    const results = run([{ type: "NAV_REQUESTED" }, { type: "NAV_REQUESTED" }]);

    expect(results.map((r) => r.state.phase)).toEqual(["covering", "covering"]);
  });

  it("sets shouldResetScroll true throughout the forward-nav path", () => {
    const results = run([
      { type: "NAV_REQUESTED" },
      { type: "COVER_DONE" },
      { type: "ROUTE_COMMITTED" },
      { type: "UNCOVER_DONE" },
    ]);

    expect(results.map((r) => r.shouldResetScroll)).toEqual([true, true, true, false]);
  });

  it("sets shouldResetScroll false throughout the back/forward path", () => {
    const results = run([{ type: "POPSTATE" }, { type: "ROUTE_COMMITTED" }, { type: "UNCOVER_DONE" }]);

    expect(results.every((r) => r.shouldResetScroll === false)).toBe(true);
  });

  it("sets shouldResetScroll false throughout the first-load path", () => {
    const results = run([{ type: "FIRST_LOAD_READY" }, { type: "ROUTE_COMMITTED" }, { type: "UNCOVER_DONE" }]);

    expect(results.every((r) => r.shouldResetScroll === false)).toBe(true);
  });

  it("sets shouldFadeCursor only while covered", () => {
    const results = run([
      { type: "NAV_REQUESTED" },
      { type: "COVER_DONE" },
      { type: "ROUTE_COMMITTED" },
      { type: "UNCOVER_DONE" },
    ]);

    expect(results.map((r) => r.shouldFadeCursor)).toEqual([false, true, false, false]);
  });

  it("starts idle with no path", () => {
    const state: TransitionState = initialTransitionState;
    expect(state).toEqual({ phase: "idle", path: null });
  });
});
