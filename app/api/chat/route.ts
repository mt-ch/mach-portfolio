import { NextResponse } from "next/server";

import { buildContext } from "@/lib/assistant/chat/context";
import { condenseQuery } from "@/lib/assistant/chat/condense";
import { streamAnswer } from "@/lib/assistant/chat/generateAnswer";
import { retrieveChunks } from "@/lib/assistant/chat/retrieve";
import type { ChatTurn } from "@/lib/assistant/chat/types";
import { isAnswerGrounded } from "@/lib/assistant/guardrails/citationCheck";
import { passesConfidenceGate } from "@/lib/assistant/guardrails/confidenceGate";
import { getClientIp } from "@/lib/assistant/guardrails/getClientIp";
import { checkRateLimits } from "@/lib/assistant/guardrails/rateLimit";
import { REFUSAL_MESSAGE } from "@/lib/assistant/guardrails/refusal";
import { sanitizeInput } from "@/lib/assistant/guardrails/sanitize";

export const runtime = "nodejs";

// Tighter than reframe's 500-character default, per the chat spec.
const MESSAGE_MAX_LENGTH = 400;

function sseEvent(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// A single SSE event carrying the fixed refusal string, used both when the
// pre-generation confidence gate skips generation outright and when the
// post-generation citation check discards an ungrounded answer.
function refusalStream(): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        encoder.encode(sseEvent("refusal", { message: REFUSAL_MESSAGE })),
      );
      controller.close();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
    },
  });
}

function isChatTurn(item: unknown): item is ChatTurn {
  if (!item || typeof item !== "object") return false;
  const { role, text } = item as { role?: unknown; text?: unknown };
  return (role === "user" || role === "assistant") && typeof text === "string";
}

// Shape validation only — a malformed or oversized history (tampered/forged,
// or longer than the client's own truncation) is guardrails' concern (#48),
// not this route's; malformed entries are dropped rather than erroring.
function parseHistory(raw: unknown): ChatTurn[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isChatTurn);
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    message?: unknown;
    history?: unknown;
    sessionId?: unknown;
  };
  const raw = typeof body.message === "string" ? body.message : "";
  const history = parseHistory(body.history);
  const ip = getClientIp(request);
  // Ephemeral, client-generated — used only as a rate-limit key, never
  // stored or treated as an identity/session record. Falls back to the IP
  // (not a shared constant) so requests without one still get an
  // individually-scoped session bucket rather than colliding into one
  // site-wide bucket shared by every visitor.
  const sessionId =
    typeof body.sessionId === "string" && body.sessionId.length > 0 ? body.sessionId : ip;

  const rateLimitResult = await checkRateLimits(ip, sessionId);
  if (!rateLimitResult.ok) {
    return NextResponse.json(
      { message: "Too many requests", reason: rateLimitResult.reason },
      { status: 429 },
    );
  }

  const sanitized = sanitizeInput(raw, MESSAGE_MAX_LENGTH);
  if (!sanitized.ok) {
    return NextResponse.json(
      { message: `Invalid message: ${sanitized.reason}` },
      { status: 400 },
    );
  }

  // The condensed query is used only for embedding/retrieval below — the
  // generation call further down still gets the visitor's original message.
  let retrievalQuery = sanitized.value;
  try {
    retrievalQuery = await condenseQuery(sanitized.value, history);
  } catch (error) {
    console.error("POST /api/chat: condensation failed", error);
  }

  let chunks;
  try {
    chunks = await retrieveChunks(retrievalQuery);
  } catch (error) {
    console.error("POST /api/chat: retrieval failed", error);
    return NextResponse.json(
      { message: "Unable to process request" },
      { status: 502 },
    );
  }

  // Weak retrieval means generating against it risks a hallucinated answer,
  // so generation is skipped entirely in favor of the fixed refusal — this
  // is the first of the two grounding gates (the second runs post-generation
  // below).
  if (!passesConfidenceGate(chunks)) {
    return refusalStream();
  }

  const { contextText, citations } = buildContext(chunks);

  // Deltas are buffered rather than forwarded live, so the full answer can
  // be checked for citation traceability (the second grounding gate) before
  // any of it reaches the client — an ungrounded answer must never be
  // partially shown before the check catches it.
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const deltas: string[] = [];
      let generationFailed = false;

      try {
        for await (const delta of streamAnswer(sanitized.value, contextText)) {
          deltas.push(delta);
        }
      } catch (error) {
        console.error("POST /api/chat: generation call failed", error);
        generationFailed = true;
      }

      const answerText = deltas.join("");
      // A total failure (nothing generated before the call threw) has no
      // grounded/ungrounded answer to fall back to — it's a real error, not
      // a refusal. A failure that still yielded some grounded partial text
      // is left alone below; that's not a client-visible failure.
      const noAnswerFromFailure = generationFailed && deltas.length === 0;
      const grounded = answerText.trim() === "" || isAnswerGrounded(answerText, contextText);

      // Guards enqueue/close the same way: if the client has already
      // disconnected, the controller may throw.
      try {
        if (noAnswerFromFailure) {
          controller.enqueue(
            encoder.encode(sseEvent("error", { message: "Unable to generate a response" })),
          );
        } else if (grounded) {
          for (const delta of deltas) {
            controller.enqueue(encoder.encode(sseEvent("delta", { text: delta })));
          }
          controller.enqueue(encoder.encode(sseEvent("citations", { citations })));
        } else {
          controller.enqueue(
            encoder.encode(sseEvent("refusal", { message: REFUSAL_MESSAGE })),
          );
        }
        controller.close();
      } catch (error) {
        console.error("POST /api/chat: failed to flush response", error);
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
    },
  });
}
