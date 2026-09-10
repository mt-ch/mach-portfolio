import { describe, expect, it } from "vitest";

import { firstLoadTransitionResult, initialTransitionState, transitionPhase } from "./transitionPhase";
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
  it("starts idle", () => {
    const state: TransitionState = initialTransitionState;
    expect(state).toEqual({ phase: "idle" });
  });

  it("seeds the first load already covered", () => {
    expect(firstLoadTransitionResult.state.phase).toBe("covered");
    expect(firstLoadTransitionResult.shouldFadeCursor).toBe(true);
  });

  it("drives covered -> uncovering -> idle on the first-load path", () => {
    const results = run([
      { type: "FIRST_LOAD_READY" },
      { type: "ROUTE_COMMITTED" },
      { type: "UNCOVER_DONE" },
    ]);

    expect(results.map((r) => r.state.phase)).toEqual(["covered", "uncovering", "idle"]);
  });

  it("keeps the cursor faded until back at idle", () => {
    const results = run([
      { type: "FIRST_LOAD_READY" },
      { type: "ROUTE_COMMITTED" },
      { type: "UNCOVER_DONE" },
    ]);

    expect(results.map((r) => r.shouldFadeCursor)).toEqual([true, true, false]);
  });

  it("forces covered -> uncovering on SAFETY_TIMEOUT", () => {
    const results = run([{ type: "FIRST_LOAD_READY" }, { type: "SAFETY_TIMEOUT" }, { type: "UNCOVER_DONE" }]);

    expect(results.map((r) => r.state.phase)).toEqual(["covered", "uncovering", "idle"]);
  });

  it("forces uncovering -> idle on SAFETY_TIMEOUT as a last-resort net", () => {
    const results = run([
      { type: "FIRST_LOAD_READY" },
      { type: "ROUTE_COMMITTED" },
      { type: "SAFETY_TIMEOUT" },
    ]);

    expect(results.at(-1)?.state.phase).toBe("idle");
    expect(results.at(-1)?.shouldFadeCursor).toBe(false);
  });

  it("ignores SAFETY_TIMEOUT while idle", () => {
    expect(transitionPhase(initialTransitionState, { type: "SAFETY_TIMEOUT" }).state.phase).toBe("idle");
  });

  it("ignores ROUTE_COMMITTED and UNCOVER_DONE out of sequence", () => {
    expect(transitionPhase(initialTransitionState, { type: "ROUTE_COMMITTED" }).state.phase).toBe("idle");
    expect(transitionPhase(initialTransitionState, { type: "UNCOVER_DONE" }).state.phase).toBe("idle");
  });
});
