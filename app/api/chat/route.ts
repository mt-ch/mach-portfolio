import { NextResponse } from "next/server";

import { streamAnswerDeltas } from "@/lib/chat/generateAnswer";
import {
  embedQuery,
  retrieveChunks,
  type RetrievedChunk,
} from "@/lib/chat/retrieve";
import { getClientIp } from "@/lib/guardrails/getClientIp";
import { checkRequestGuardrails } from "@/lib/guardrails/rateLimit";
import { sanitizeInput } from "@/lib/guardrails/sanitize";

export const runtime = "nodejs";

const MESSAGE_MAX_LENGTH = 400;

function sseEvent(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// Citations are built from whatever chunks were retrieved for this turn; a
// post-generation traceability check (does the answer actually use each
// citation) is a guardrail layered on in a later ticket, not here.
function toCitations(chunks: RetrievedChunk[]) {
  const seen = new Set<string>();
  const citations: { label: string; href: string }[] = [];

  for (const chunk of chunks) {
    if (!chunk.href || seen.has(chunk.href)) continue;
    seen.add(chunk.href);
    citations.push({ label: chunk.label, href: chunk.href });
  }

  return citations;
}

export async function POST(request: Request) {
  const guardrail = await checkRequestGuardrails(getClientIp(request));
  if (!guardrail.ok) {
    return NextResponse.json(
      { message: "Unable to process request" },
      { status: 429 },
    );
  }

  const body = (await request.json()) as { message?: unknown };
  const raw = typeof body.message === "string" ? body.message : "";

  const sanitized = sanitizeInput(raw, MESSAGE_MAX_LENGTH);
  if (!sanitized.ok) {
    return NextResponse.json(
      { message: `Invalid message: ${sanitized.reason}` },
      { status: 400 },
    );
  }

  let chunks: RetrievedChunk[];
  try {
    const embedding = await embedQuery(sanitized.value);
    chunks = await retrieveChunks(embedding);
  } catch (error) {
    console.error("POST /api/chat: retrieval failed", error);
    return NextResponse.json(
      { message: "Unable to process request" },
      { status: 502 },
    );
  }

  // Deltas are flushed as they generate so the client can render tokens as
  // they arrive; a generation failure mid-stream ends the stream rather than
  // failing the request, leaving whatever text already streamed in place.
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        for await (const delta of streamAnswerDeltas(
          sanitized.value,
          chunks,
        )) {
          controller.enqueue(encoder.encode(sseEvent("delta", { text: delta })));
        }
      } catch (error) {
        console.error("POST /api/chat: generation call failed", error);
      }

      controller.enqueue(
        encoder.encode(sseEvent("citations", { citations: toCitations(chunks) })),
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
