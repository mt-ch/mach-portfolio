import { NextResponse } from "next/server";

import { getClientIp } from "@/lib/guardrails/getClientIp";
import { checkRequestGuardrails } from "@/lib/guardrails/rateLimit";
import { sanitizeInput } from "@/lib/guardrails/sanitize";
import { cannedReframe } from "@/lib/reframe/cannedReframe";
import { selectProjects } from "@/lib/reframe/selectProjects";
import { getProjects } from "@/lib/sanity";

export const runtime = "nodejs";

function sseEvent(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function POST(request: Request) {
  const guardrail = await checkRequestGuardrails(getClientIp(request));
  if (!guardrail.ok) {
    return NextResponse.json(
      { message: "Unable to process request" },
      { status: 429 },
    );
  }

  const body = (await request.json()) as { intent?: unknown };
  const raw = typeof body.intent === "string" ? body.intent : "";

  const sanitized = sanitizeInput(raw);
  if (!sanitized.ok) {
    return NextResponse.json(
      { message: `Invalid intent: ${sanitized.reason}` },
      { status: 400 },
    );
  }

  const projects = await getProjects();

  let selected;
  try {
    selected = await selectProjects(sanitized.value, projects);
  } catch (error) {
    console.error("POST /api/reframe: selection call failed", error);
    return NextResponse.json(
      { message: "Unable to process request" },
      { status: 502 },
    );
  }

  const selection = { selected };
  const { copy } = cannedReframe(sanitized.value);

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
