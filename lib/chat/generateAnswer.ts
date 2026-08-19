import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-haiku-4-5";

let client: Anthropic | undefined;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic();
  }
  return client;
}

const SYSTEM_PROMPT = [
  "You are the Q&A assistant embedded in Matt Chan's portfolio site.",
  "Answer the visitor's question using only the supplied portfolio context below — About, Project, and Experience entries.",
  "Never invent employers, technologies, dates, or outcomes that aren't in the context.",
  "Write a direct, conversational answer in a few sentences.",
].join(" ");

// Yields text deltas as they arrive from the model, for the route handler to
// forward as SSE events without buffering the full response first.
export async function* streamAnswer(
  message: string,
  contextText: string,
): AsyncGenerator<string> {
  const stream = getClient().messages.stream({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
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

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}
