"use client";

import type { ChatMessage } from "./types";

export function ChatMessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-md bg-black px-3 py-2 text-sm text-white dark:bg-white dark:text-black">
          {message.text}
        </div>
      </div>
    );
  }

  if (message.role === "assistant-refusal") {
    return (
      <div className="flex justify-start">
        <div
          role="status"
          className="flex max-w-[85%] items-start gap-2 rounded-md border border-amber-400/40 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
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

  const citations = message.role === "assistant" ? message.citations : [];

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] space-y-2">
        <div
          className={`rounded-md bg-gray-100 px-3 py-2 text-sm dark:bg-gray-800 ${
            message.role === "assistant-intro" ? "text-gray-500 dark:text-gray-400" : ""
          }`}
        >
          {message.text}
        </div>
        {citations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pl-1">
            {citations.map((citation) => (
              <a
                key={citation.href}
                href={citation.href}
                className="rounded-full border border-gray-200 px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-gray-800"
              >
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
      <div className="flex items-center gap-1 rounded-md bg-gray-100 px-3 py-2.5 dark:bg-gray-800">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 animate-bounce rounded-full bg-gray-400 motion-reduce:animate-none dark:bg-gray-500"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
