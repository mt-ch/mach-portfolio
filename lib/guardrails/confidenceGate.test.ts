import { describe, expect, it } from "vitest";

import { passesConfidenceGate } from "./confidenceGate";

function chunk(score: number) {
  return {
    id: "doc-1:0",
    score,
    metadata: { documentType: "about" as const, documentId: "doc-1" },
    text: "some retrieved text",
  };
}

describe("passesConfidenceGate", () => {
  it("fails when no chunks were retrieved", () => {
    expect(passesConfidenceGate([])).toBe(false);
  });

  it("passes when the top match clears the confidence threshold", () => {
    expect(passesConfidenceGate([chunk(0.82), chunk(0.4)])).toBe(true);
  });

  it("fails when the top match is below the confidence threshold", () => {
    expect(passesConfidenceGate([chunk(0.31)])).toBe(false);
  });

  it("only considers the top match, not weaker matches further down", () => {
    expect(passesConfidenceGate([chunk(0.9), chunk(0.01)])).toBe(true);
  });
});
