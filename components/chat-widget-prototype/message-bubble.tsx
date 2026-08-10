"use client";

// PROTOTYPE — throwaway. Shared bubble rendering only (like a <Header>);
// each variant owns its own panel layout. See issue #40.

import { AlertCircle, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "./use-mock-conversation";

export function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl bg-primary px-3 py-2 text-sm text-primary-foreground">
          {message.text}
        </div>
      </div>
    );
  }

  if (message.role === "assistant-refusal") {
    return (
      <div className="flex justify-start">
        <div className="flex max-w-[85%] items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-200">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{message.text}</span>
        </div>
      </div>
    );
  }

  const citations = "citations" in message ? message.citations : [];

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] space-y-2">
        <div
          className={cn(
            "rounded-2xl bg-muted px-3 py-2 text-sm text-foreground",
            message.role === "assistant-intro" && "text-muted-foreground"
          )}
        >
          {message.text}
        </div>
        {citations.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pl-1">
            {citations.map((c) => (
              <a
                key={c.label}
                href={c.href}
                className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              >
                <Quote className="size-3" />
                {c.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl bg-muted px-3 py-2.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
