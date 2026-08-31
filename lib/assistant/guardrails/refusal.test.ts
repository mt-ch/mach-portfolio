import { describe, expect, it } from "vitest";
import { REFUSAL_MESSAGE } from "./refusal";

describe("REFUSAL_MESSAGE", () => {
  it("is the fixed first-person refusal constant", () => {
    expect(REFUSAL_MESSAGE).toBe(
      "I can only answer questions about my background, work, and projects — " +
        "try asking about one of those.",
    );
  });

  it("speaks in the first person, not about Matt in the third person", () => {
    expect(REFUSAL_MESSAGE).toMatch(/\bmy\b/);
    expect(REFUSAL_MESSAGE).not.toMatch(/Matt/);
  });
});
