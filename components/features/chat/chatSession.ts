import type { ChatMessage } from "./types";

const HISTORY_STORAGE_KEY = "chat:history";
const SESSION_ID_STORAGE_KEY = "chat:sessionId";

// Sent to /api/chat as context per request.
export const SENT_TURN_PAIRS = 6;
// Client-side storage ceiling before older turns are trimmed. Larger than
// SENT_TURN_PAIRS so a visitor can scroll back further than what's actually
// fed into generation context.
export const STORED_TURN_PAIRS = 20;

export function loadStoredMessages(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

export function saveStoredMessages(messages: ChatMessage[]): void {
  try {
    sessionStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify(trimToTurnPairs(messages, STORED_TURN_PAIRS)),
    );
  } catch {
    // sessionStorage unavailable (private mode, quota) — history just won't
    // survive navigation; the in-memory conversation still works this tab.
  }
}

export function clearStoredMessages(): void {
  try {
    sessionStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function getOrCreateSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_ID_STORAGE_KEY);
    if (existing) return existing;
    const created = crypto.randomUUID();
    sessionStorage.setItem(SESSION_ID_STORAGE_KEY, created);
    return created;
  } catch {
    return crypto.randomUUID();
  }
}

function trimToTurnPairs(messages: ChatMessage[], maxPairs: number): ChatMessage[] {
  const maxMessages = maxPairs * 2;
  if (messages.length <= maxMessages) return messages;
  return messages.slice(messages.length - maxMessages);
}

// The intro message is synthesized locally, never sent as history.
export function toHistoryTurns(
  messages: ChatMessage[],
): { role: "user" | "assistant"; text: string }[] {
  const turns = messages
    .filter((m) => m.role === "user" || m.role === "assistant" || m.role === "assistant-refusal")
    .map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("assistant" as const),
      text: m.text,
    }))
    .filter((t) => t.text.trim() !== "");

  const maxMessages = SENT_TURN_PAIRS * 2;
  return turns.slice(Math.max(0, turns.length - maxMessages));
}
