"use client";

import { AlertTriangleIcon, RotateCwIcon } from "lucide-react";

import type { ChatMessage } from "./types";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  onRetry?: (id: string) => void;
  retryDisabled?: boolean;
}

export function ChatMessageBubble({ message, onRetry, retryDisabled }: ChatMessageBubbleProps) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-white p-sm type-small border border-grey-200 text-black">{message.text}</div>
      </div>
    );
  }

  if (message.role === "assistant-refusal") {
    return (
      <div role="status" className="flex justify-start type-small text-black">
        <span>{message.text}</span>
      </div>
    );
  }

  if (message.role === "assistant-error") {
    return (
      <div className="flex justify-start">
        <div
          role="alert"
          className="flex max-w-[85%] flex-col items-start gap-xs rounded-md border border-error-border bg-error-background px-3 py-2 text-sm text-error-foreground"
        >
          <div className="flex items-start gap-2">
            <AlertTriangleIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>{message.text}</span>
          </div>
          {onRetry && (
            <button
              type="button"
              onClick={() => onRetry(message.id)}
              disabled={retryDisabled}
              className="inline-flex items-center gap-1 self-start font-medium underline decoration-error-foreground/40 underline-offset-2 hover:decoration-error-foreground disabled:opacity-40"
            >
              <RotateCwIcon aria-hidden="true" className="size-3" strokeWidth={2} />
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  const citations = message.role === "assistant" ? message.citations : [];

  return (
    <div className="flex justify-start" data-testid="assistant-bubble">
      <div className="space-y-2">
        <div className="bg-white p-sm type-body border border-grey-200 text-black">{message.text}</div>
        {citations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pl-1">
            {citations.map((citation) => (
              <a key={citation.href} href={citation.href} className="border border-grey-200 p-xs type-small text-grey-400 hover:bg-grey-100">
                {citation.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
