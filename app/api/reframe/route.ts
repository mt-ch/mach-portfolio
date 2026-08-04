import { NextResponse } from "next/server";

import { sanitizeInput } from "@/lib/guardrails/sanitize";
import { cannedReframe } from "@/lib/reframe/cannedReframe";

export const runtime = "nodejs";

function sseEvent(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: Request) {
  const body = (await request.json()) as { intent?: unknown };
  const raw = typeof body.intent === "string" ? body.intent : "";

  const sanitized = sanitizeInput(raw);
  if (!sanitized.ok) {
    return NextResponse.json(
      { message: `Invalid intent: ${sanitized.reason}` },
      { status: 400 },
    );
  }

  const { selection, copy } = cannedReframe(sanitized.value);

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(sseEvent("selection", selection)));
      controller.enqueue(encoder.encode(sseEvent("copy", copy)));
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
