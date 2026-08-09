import { NextResponse } from "next/server";

import { getClientIp } from "@/lib/guardrails/getClientIp";
import { checkRequestGuardrails } from "@/lib/guardrails/rateLimit";
import { sanitizeInput } from "@/lib/guardrails/sanitize";
import { generateCopy, type SelectedProject } from "@/lib/reframe/generateCopy";
import { selectProjects } from "@/lib/reframe/selectProjects";
import { getAbout, getProject, getProjects } from "@/lib/sanity";

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

  const [projects, about] = await Promise.all([getProjects(), getAbout()]);

  if (!about) {
    console.error("POST /api/reframe: no About record to generate copy from");
    return NextResponse.json(
      { message: "Unable to process request" },
      { status: 502 },
    );
  }

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

  // Generation needs case-study depth, so the selected Projects — and only
  // those — are re-fetched in full rather than widening the list query.
  const details = await Promise.all(
    selected.map(async (entry) => {
      const project = await getProject(entry.slug);
      return project
        ? ({ project, match_reason: entry.match_reason } as SelectedProject)
        : null;
    }),
  );
  const selectedProjects = details.filter(
    (entry): entry is SelectedProject => entry !== null,
  );

  // Selection is flushed as soon as it is known so the client can reorder and
  // highlight cards while the slower generation call is still running; a
  // generation failure then ends the stream rather than failing the request,
  // leaving the already-delivered selection in place.
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(sseEvent("selection", selection)));

      try {
        const copy = await generateCopy(
          sanitized.value,
          selectedProjects,
          about,
        );
        controller.enqueue(encoder.encode(sseEvent("copy", copy)));
      } catch (error) {
        console.error("POST /api/reframe: generation call failed", error);
      }

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
