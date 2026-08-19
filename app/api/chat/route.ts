import { NextResponse } from "next/server";

import { buildContext } from "@/lib/chat/context";
import { streamAnswer } from "@/lib/chat/generateAnswer";
import { retrieveChunks } from "@/lib/chat/retrieve";
import { sanitizeInput } from "@/lib/guardrails/sanitize";

export const runtime = "nodejs";

// Tighter than reframe's 500-character default, per the chat spec.
const MESSAGE_MAX_LENGTH = 400;

function sseEvent(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: Request) {
  const body = (await request.json()) as { message?: unknown };
  const raw = typeof body.message === "string" ? body.message : "";

  const sanitized = sanitizeInput(raw, MESSAGE_MAX_LENGTH);
  if (!sanitized.ok) {
    return NextResponse.json(
      { message: `Invalid message: ${sanitized.reason}` },
      { status: 400 },
    );
  }

  let chunks;
  try {
    chunks = await retrieveChunks(sanitized.value);
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

      controller.enqueue(encoder.encode(sseEvent("citations", { citations })));
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
