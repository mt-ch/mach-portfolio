"use client";

// PROTOTYPE — throwaway. Variant B: an always-visible bottom-center input
// bar (no launcher) that expands the conversation upward above it.
// See issue #40.

import { useState } from "react";
import { ArrowUp, Sparkles, X } from "lucide-react";
import { MessageBubble, TypingIndicator } from "./message-bubble";
import { useMockConversation } from "./use-mock-conversation";

export const name = "Command bar (always-visible input, expands upward)";

export function VariantB() {
  const { messages, isThinking, send, suggestions } = useMockConversation();
  const [draft, setDraft] = useState("");
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex flex-col items-center">
      {expanded && (
        <div className="pointer-events-auto mb-3 flex h-[24rem] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <Sparkles className="size-3.5 text-muted-foreground" />
              Ask about Matt
            </span>
            <button
              onClick={() => setExpanded(false)}
              className="rounded-full p-1 text-muted-foreground hover:bg-accent"
              aria-label="Collapse"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {isThinking && <TypingIndicator />}
          </div>
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 border-t border-border px-4 py-2.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.trim()) return;
          setExpanded(true);
          send(draft.trim());
          setDraft("");
        }}
        className="pointer-events-auto flex w-full max-w-lg items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 shadow-xl"
      >
        <Sparkles className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => setExpanded(true)}
          placeholder="Ask about Matt's projects, experience, or background…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"
          disabled={!draft.trim()}
          aria-label="Send"
        >
          <ArrowUp className="size-4" />
        </button>
      </form>
    </div>
  );
}
