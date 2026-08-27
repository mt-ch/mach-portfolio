import { describe, expect, it } from "vitest";

import { isAnswerGrounded } from "./citationCheck";

const CONTEXT = [
  "Title: Collab Canvas",
  "Summary: Real-time collaborative canvas under load, built with distributed systems techniques.",
  "Experience: Backend Engineer at Acme Corp, 2019-2022.",
].join("\n\n");

describe("isAnswerGrounded", () => {
  it("passes an answer whose content words are traceable to the retrieved context", () => {
    const answer = "Yes, he built Collab Canvas using distributed systems techniques at Acme Corp.";

    expect(isAnswerGrounded(answer, CONTEXT)).toBe(true);
  });

  it("fails an answer whose content words are not present in the retrieved context", () => {
    const answer = "The weather today is sunny and warm in Paris.";

    expect(isAnswerGrounded(answer, CONTEXT)).toBe(false);
  });

  it("passes a short answer with no significant words to check", () => {
    expect(isAnswerGrounded("Yes.", CONTEXT)).toBe(true);
  });

  it("passes an empty answer", () => {
    expect(isAnswerGrounded("", CONTEXT)).toBe(true);
  });

  it("fails when only a minority of content words are traceable", () => {
    const answer =
      "He worked on Collab Canvas but also ran marathons, painted landscapes, and studied astrophysics.";

    expect(isAnswerGrounded(answer, CONTEXT)).toBe(false);
  });
});
