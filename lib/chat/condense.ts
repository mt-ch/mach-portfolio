import { CHAT_MODEL, getAnthropicClient } from "./anthropicClient";
import type { ChatTurn } from "./types";

// Bounds the condensation call's own cost and keeps the rewrite from
// drifting onto stale earlier subjects in a longer conversation.
const HISTORY_TURN_PAIRS = 3;

const SYSTEM_PROMPT = [
  "You rewrite a visitor's latest chat message into one self-contained question, using the conversation history to resolve pronouns and implicit references (e.g. 'how long was he there?' after a message about a specific employer).",
  "Output only the rewritten question, nothing else — no preamble, no quotes.",
  "If the latest message is already self-contained, return it unchanged.",
].join(" ");

function formatHistory(history: ChatTurn[]): string {
  return history
    .map((turn) => `${turn.role === "user" ? "Visitor" : "Assistant"}: ${turn.text}`)
    .join("\n");
}

// Skips the model call entirely on the first turn — no history exists to
// condense against, and the raw message is already self-contained.
export async function condenseQuery(
  message: string,
  history: ChatTurn[],
): Promise<string> {
  if (history.length === 0) return message;

  const recentHistory = history.slice(-HISTORY_TURN_PAIRS * 2);

  const response = await getAnthropicClient().messages.create({
    model: CHAT_MODEL,
    max_tokens: 200,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          "Conversation so far:",
          formatHistory(recentHistory),
          "Latest message:",
          message,
        ].join("\n\n"),
      },
    ],
  });

  const block = response.content.find((entry) => entry.type === "text");
  const rewritten = block && block.type === "text" ? block.text.trim() : "";
  return rewritten || message;
}
