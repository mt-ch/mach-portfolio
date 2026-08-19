import { NextResponse } from "next/server";

import { buildContext } from "@/lib/chat/context";
import { condenseQuery } from "@/lib/chat/condense";
import { streamAnswer } from "@/lib/chat/generateAnswer";
import { retrieveChunks } from "@/lib/chat/retrieve";
import type { ChatTurn } from "@/lib/chat/types";
import { sanitizeInput } from "@/lib/guardrails/sanitize";

export const runtime = "nodejs";

// Tighter than reframe's 500-character default, per the chat spec.
const MESSAGE_MAX_LENGTH = 400;

function sseEvent(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
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
  const body = (await request.json()) as { message?: unknown; history?: unknown };
  const raw = typeof body.message === "string" ? body.message : "";
  const history = parseHistory(body.history);

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

  const { contextText, citations } = buildContext(chunks);

  // Citations are already known from retrieval before generation starts, so
  // they're always flushed as the closing event even if generation fails
  // partway through — the client keeps whatever text deltas did arrive.
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        for await (const delta of streamAnswer(sanitized.value, contextText)) {
          controller.enqueue(encoder.encode(sseEvent("delta", { text: delta })));
        }
      } catch (error) {
        console.error("POST /api/chat: generation call failed", error);
      }

      // Guards the same way the generation loop above does: if the client
      // has already disconnected, the controller may throw on enqueue/close.
      try {
        controller.enqueue(encoder.encode(sseEvent("citations", { citations })));
        controller.close();
      } catch (error) {
        console.error("POST /api/chat: failed to flush citations", error);
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
