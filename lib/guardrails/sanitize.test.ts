import { describe, expect, it } from "vitest";
import { sanitizeInput } from "./sanitize";

describe("sanitizeInput", () => {
  it("rejects an empty string", () => {
    const result = sanitizeInput("");

    expect(result).toEqual({ ok: false, reason: "empty" });
  });

  it("rejects whitespace-only input", () => {
    const result = sanitizeInput("   \n\t  ");

    expect(result).toEqual({ ok: false, reason: "empty" });
  });

  it("trims leading and trailing whitespace from valid input", () => {
    const result = sanitizeInput("  show me frontend work  ");

    expect(result).toEqual({ ok: true, value: "show me frontend work" });
  });

  it("strips control characters", () => {
    const result = sanitizeInput("hiring\x00 for\x07 a role\x1b[31m");

    expect(result).toEqual({ ok: true, value: "hiring for a role[31m" });
  });

  it("collapses excessive whitespace and newlines into a single space", () => {
    const result = sanitizeInput("show me\n\n\n   something    with\t\tstate");

    expect(result).toEqual({
      ok: true,
      value: "show me something with state",
    });
  });

  it("rejects input over the default max length", () => {
    const result = sanitizeInput("a".repeat(501));

    expect(result).toEqual({ ok: false, reason: "too_long" });
  });

  it("accepts input at exactly the default max length", () => {
    const result = sanitizeInput("a".repeat(500));

    expect(result).toEqual({ ok: true, value: "a".repeat(500) });
  });

  it("respects a custom max length", () => {
    const result = sanitizeInput("a".repeat(11), 10);

    expect(result).toEqual({ ok: false, reason: "too_long" });
  });
});
