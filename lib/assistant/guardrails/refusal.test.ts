import { describe, expect, it } from "vitest";

import { REFUSAL_MESSAGE } from "./refusal";

describe("REFUSAL_MESSAGE", () => {
  it("is the fixed first-person refusal constant", () => {
    expect(REFUSAL_MESSAGE).toBe(
      "I can only answer questions about my background, work, and projects — " +
        "try asking about one of those.",
    );
  });

  it("speaks in the first person", () => {
    expect(REFUSAL_MESSAGE).toMatch(/\bmy background\b/);
    expect(REFUSAL_MESSAGE).not.toMatch(/Matt's/);
  });
});
