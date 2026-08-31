import type { ProjectReference } from "@/lib/assistant/chat/types";

import type { ChatErrorCause } from "./chatErrors";

export type ChatMessage =
  | { id: string; role: "user"; text: string }
  | {
      id: string;
      role: "assistant";
      text: string;
      projectReference: ProjectReference | null;
    }
  | { id: string; role: "assistant-refusal"; text: string }
  | {
      id: string;
      role: "assistant-error";
      text: string;
      cause: ChatErrorCause;
      retryText: string;
      attempts: number;
    };

// The placeholder shape send()/retry() push before any content has arrived —
// what appendDelta and setProjectReference fill in as the stream progresses.
export function isEmptyAssistantMessage(message: ChatMessage): boolean {
  return (
    message.role === "assistant" &&
    message.text === "" &&
    message.projectReference === null
  );
}
