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
        <div className="bg-white p-sm type-body border border-grey-200 text-black">{message.text}</div>
      </div>
    );
  }

  if (message.role === "assistant-refusal") {
    return (
      <div className="flex justify-start">
        <div
          role="status"
          className="flex max-w-[85%] items-start gap-2 rounded-md border border-refusal-border bg-refusal-background px-3 py-2 text-sm text-refusal-foreground"
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 size-4 shrink-0">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.72-1.36 3.486 0l6.516 11.59c.75 1.334-.213 2.986-1.743 2.986H3.484c-1.53 0-2.493-1.652-1.743-2.986l6.516-11.59zM10 7a1 1 0 011 1v3a1 1 0 11-2 0V8a1 1 0 011-1zm0 8a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          <span>{message.text}</span>
        </div>
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
    <div className="flex justify-start">
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

export function ChatTypingIndicator() {
  return (
    <div className="flex justify-start" role="status" aria-label="Assistant is typing">
      <div className="flex items-center gap-xs">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.75 animate-bounce rounded-full bg-brand motion-reduce:animate-none"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
