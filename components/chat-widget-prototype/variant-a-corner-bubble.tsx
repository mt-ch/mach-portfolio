"use client";

// PROTOTYPE — throwaway. Variant A: classic bottom-right launcher that
// expands into an anchored corner panel. See issue #40.

import { useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageBubble, TypingIndicator } from "./message-bubble";
import { useMockConversation } from "./use-mock-conversation";

export const name = "Corner bubble (launcher + anchored panel)";

export function VariantA() {
  const [open, setOpen] = useState(false);
  const { messages, isThinking, send, suggestions } = useMockConversation();
  const [draft, setDraft] = useState("");

  return (
    <div className="fixed right-6 bottom-6 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[28rem] w-[22rem] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="font-heading text-sm font-medium">
              Ask about Matt
            </span>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-muted-foreground hover:bg-accent"
              aria-label="Close chat"
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

          <div className="border-t border-border p-3">
            <div className="mb-2 flex flex-wrap gap-1.5">
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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!draft.trim()) return;
                send(draft.trim());
                setDraft("");
              }}
              className="flex items-center gap-2"
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ask a question…"
                className="flex-1 rounded-full border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <Button type="submit" size="icon" className="rounded-full">
                <Send className="size-4" />
              </Button>
            </form>
          </div>
        </div>
      )}

      <Button
        onClick={() => setOpen((o) => !o)}
        size="icon"
        className="size-14 rounded-full shadow-xl"
        aria-label={open ? "Close chat" : "Open chat"}
      >
        <MessageCircle className="size-6" />
      </Button>
    </div>
  );
}
