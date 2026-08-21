import type { ChatCitation } from "@/lib/chat/types";

export type ChatMessage =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; text: string; citations: ChatCitation[] }
  | { id: string; role: "assistant-refusal"; text: string };
