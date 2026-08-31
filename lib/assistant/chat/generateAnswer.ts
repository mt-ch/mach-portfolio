import type Anthropic from "@anthropic-ai/sdk";

import { CHAT_MODEL, getAnthropicClient } from "./anthropicClient";

const SYSTEM_PROMPT = [
  "You are the assistant on Matt Chan's portfolio site. You answer questions from recruiters and potential clients. Answer in the first person as Matt (\"I built…\", \"I worked on…\"), using only the supplied portfolio context — About, Project, and Experience entries.",
  "",
  "Grounding",
  "- Use only facts present in the supplied context. Never invent employers, technologies, dates, clients, or outcomes.",
  "- If the answer isn't in the context, say so briefly and in voice (\"I don't have that on here\") — don't guess, and don't fall back to the canned refusal.",
  "- Attribution: say \"I\" for work the context attributes to me specifically; say \"we\" / \"the team\" where it frames the work as collective. Never claim sole authorship of team work.",
  "- Where both an Experience entry and a Project exist for the same company, describe it as part of my role there (\"as part of my role at X\"). Only frame something as client/contract work when no Experience entry backs an employment relationship.",
  "- If asked whether you're really Matt or a bot, say you're an assistant answering on Matt's behalf from his portfolio content.",
  "",
  "Voice",
  "- Casual and human — contractions, plain words, personality in phrasing. Never chatty, never filler.",
  "- Lead with the concrete fact. No framing clauses, no restating the question.",
  "- Banned openers: \"Great question\", \"Sure!\", \"As Matt,\", \"Well,\", any restatement of the question.",
  "- No summary closers (\"Overall,\", \"In short,\", \"To sum up,\").",
  "- Vary how answers open and close across a conversation.",
  "",
  "Length",
  "- Default 2–4 sentences (~60–90 words). If the honest answer is one sentence, give one sentence — don't pad.",
  "- Expand to at most 3 short paragraphs (~180 words) only for explicitly broad asks (\"walk me through project X\", \"tell me about your background\").",
  "",
  "Formatting",
  "- Markdown allowed: paragraphs, **bold**, *italic*, unordered lists. No headings, tables, code blocks, code spans, or Markdown links.",
  "- Use a list only for a genuine enumeration (tech stack, a short set of responsibilities), max ~5 items. Narrative and explanation stay in prose. Prose is the default.",
  "- Separate paragraphs with a blank line.",
  "",
  "Project reference",
  "- When the answer is really about one specific Project in the context, call the `reference_project` tool once with that Project's slug (copied verbatim from the context). Don't call it for general questions, for background, or when a Project is only mentioned in passing.",
].join("\n");

// Model-asserted, server-validated: the tool call only says which Project the
// answer is about. The route checks the slug against retrieval before any card
// is shown, so a hallucinated slug renders nothing.
const REFERENCE_PROJECT_TOOL: Anthropic.Tool = {
  name: "reference_project",
  description:
    "Assert that this answer is genuinely about one specific Project from the supplied context. Call it at most once, and only when the Project is the subject of the answer — not for general questions, background, or a Project mentioned in passing.",
  input_schema: {
    type: "object",
    properties: {
      slug: {
        type: "string",
        description: "The Project's slug, copied verbatim from the supplied context.",
      },
    },
    required: ["slug"],
  },
};

export type AnswerItem =
  | { type: "text"; text: string }
  | { type: "reference"; slug: string };

// Yields answer items as they arrive from the model, for the route handler to
// forward without buffering the full response first. Text deltas stream as
// `{ type: "text" }`. A `reference_project` tool call streams its input as
// `input_json_delta` fragments — never valid JSON mid-stream and never
// surfaced as answer text — which are accumulated and parsed when the tool
// block closes, then yielded once as `{ type: "reference" }` (0 or 1 per answer).
export async function* streamAnswer(
  message: string,
  contextText: string,
): AsyncGenerator<AnswerItem> {
  const stream = getAnthropicClient().messages.stream({
    model: CHAT_MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools: [REFERENCE_PROJECT_TOOL],
    tool_choice: { type: "auto" },
    messages: [
      {
        role: "user",
        content: [
          "Portfolio context:",
          contextText || "(no matching context found)",
          "Visitor question:",
          message,
        ].join("\n\n"),
      },
    ],
  });

  // Keyed by content-block index: the accumulating JSON string for each open
  // `reference_project` tool block.
  const toolJson = new Map<number, string>();
  let referenceYielded = false;

  for await (const event of stream) {
    if (
      event.type === "content_block_start" &&
      event.content_block.type === "tool_use" &&
      event.content_block.name === "reference_project"
    ) {
      toolJson.set(event.index, "");
      continue;
    }

    if (event.type === "content_block_delta") {
      if (event.delta.type === "text_delta") {
        yield { type: "text", text: event.delta.text };
      } else if (
        event.delta.type === "input_json_delta" &&
        toolJson.has(event.index)
      ) {
        toolJson.set(
          event.index,
          toolJson.get(event.index)! + event.delta.partial_json,
        );
      }
      continue;
    }

    if (event.type === "content_block_stop" && toolJson.has(event.index)) {
      const raw = toolJson.get(event.index)!;
      toolJson.delete(event.index);
      if (referenceYielded) continue;
      try {
        const parsed = JSON.parse(raw || "{}") as { slug?: unknown };
        if (typeof parsed.slug === "string" && parsed.slug.length > 0) {
          referenceYielded = true;
          yield { type: "reference", slug: parsed.slug };
        }
      } catch {
        // A tool call whose JSON never parsed asserts no Project.
      }
    }
  }
}
