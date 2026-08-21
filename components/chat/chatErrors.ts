export type ChatErrorCause = "network" | "rate-limit" | "server" | "timeout";

const CAUSE_MESSAGES: Record<ChatErrorCause, string> = {
  network: "You're offline. Check your connection and try again.",
  "rate-limit": "Too many requests — try again in a moment.",
  server: "Something went wrong. Please try again.",
  timeout: "That took too long to respond. Please try again.",
};

// After enough consecutive failures on the same message, repeating the same
// specific-sounding diagnosis (e.g. "you're offline" on attempt 3) starts to
// feel like a broken loop rather than useful information.
const ESCALATE_AFTER_ATTEMPTS = 3;
const ESCALATED_MESSAGE = "Still having trouble sending this — check your connection and try again shortly.";

export function errorMessageFor(cause: ChatErrorCause, attempts: number): string {
  if (attempts >= ESCALATE_AFTER_ATTEMPTS) return ESCALATED_MESSAGE;
  return CAUSE_MESSAGES[cause];
}
