import Anthropic from "@anthropic-ai/sdk";

export const CHAT_MODEL = "claude-haiku-4-5";

let client: Anthropic | undefined;

export function getAnthropicClient(): Anthropic {
  if (!client) {
    client = new Anthropic();
  }
  return client;
}
