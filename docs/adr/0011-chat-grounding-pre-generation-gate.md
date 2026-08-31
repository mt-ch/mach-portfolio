# Chat grounding rests on the pre-generation gate + system prompt

Issue #172 (part of the chat-response overhaul spec #171, §5) makes `/api/chat`
stream the assistant's answer to the browser token-by-token. That change removes
the last place a finished answer could be buffered, inspected, and silently
replaced — so the post-generation grounding check goes with it.

**The post-generation `isAnswerGrounded` check is removed from the request
path.** Previously the route buffered every generation delta, joined them, and
ran `lib/assistant/guardrails/citationCheck.ts` — a lexical test that computed
the fraction of the answer's significant words (length ≥ 4, minus a stopword
list) that appeared verbatim in the retrieved context, and swapped the whole
answer for the fixed refusal string below a 0.5 ratio. That check no longer
runs.

**Why it's gone:**

- **It's a crude proxy for grounding.** Word-overlap with the context says
  nothing about whether a claim is actually supported — a fluent hallucination
  that reuses context vocabulary passes, and a correct paraphrase that doesn't
  fails.
- **The assistant's own voice makes it worse.** Answers are written in a direct,
  first-person-adjacent conversational style with Markdown. Connective prose
  ("he then moved on to", "the main focus here was"), formatting tokens, and
  restated question words dilute the traceable-word ratio, pushing genuinely
  grounded answers under the threshold.
- **It can't coexist with live streaming.** Enforcing it means holding the whole
  answer back until generation finishes, which defeats the point of streaming.
  A check that can retroactively delete text the visitor has already watched
  appear is a worse experience than no check.

**Grounding is now enforced by two things only:**

1. **The pre-generation confidence gate** (`confidenceGate.ts`, unchanged):
   retrieval must return at least one non-empty chunk AND the best match score
   must be ≥ 0.5. This reads the raw retrieval output's top score, before
   `buildContext` applies its token-budget trim. On failure the route emits a
   `refusal` SSE event and never calls the model.
2. **The system prompt** in `generateAnswer.ts`: "Answer the visitor's question
   using only the supplied portfolio context… Never invent employers,
   technologies, dates, or outcomes that aren't in the context."

`refusal` is therefore strictly a pre-stream event — it is emitted before the
first `delta` or not at all, and is mutually exclusive with `delta`. Generation
throwing before any delta emits `error`; throwing after ≥ 1 delta just closes
the stream, and the client keeps the partial text.

**`citationCheck.ts` stays in-tree, unreferenced by the route.** Its tests stay
green. It is kept as a starting point for the deferred Answer-quality evaluation
(#171 defers a proper offline grounding/quality eval), not because anything in
the request path still calls it. If that evaluation doesn't materialise, the
file and its tests should be deleted rather than left as dead weight.
