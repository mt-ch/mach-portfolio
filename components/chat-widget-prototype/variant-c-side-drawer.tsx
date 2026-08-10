"use client";

// PROTOTYPE — throwaway. Variant C: a persistent edge tab that slides in a
// full-height right-side drawer. See issue #40.

import { useState } from "react";
import { PanelRightOpen, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageBubble, TypingIndicator } from "./message-bubble";
import { useMockConversation } from "./use-mock-conversation";

export const name = "Side drawer (edge tab, full-height panel)";

export function VariantC() {
  const [open, setOpen] = useState(false);
  const { messages, isThinking, send, suggestions } = useMockConversation();
  const [draft, setDraft] = useState("");

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed top-1/2 right-0 z-40 flex -translate-y-1/2 items-center gap-1.5 rounded-l-xl border border-r-0 border-border bg-card px-2.5 py-4 text-muted-foreground shadow-lg hover:text-foreground"
          aria-label="Open chat"
          style={{ writingMode: "vertical-rl" }}
        >
          <PanelRightOpen className="mb-1 size-4 rotate-90" />
          Ask about Matt
        </button>
      )}

      <div
        className={`fixed inset-y-0 right-0 z-40 flex h-full w-full max-w-sm flex-col border-l border-border bg-card shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <div>
            <div className="font-heading text-sm font-medium">
              Ask about Matt
            </div>
            <div className="text-xs text-muted-foreground">
              Grounded in his projects &amp; experience
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded-full p-1 text-muted-foreground hover:bg-accent"
            aria-label="Close chat"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {isThinking && <TypingIndicator />}
        </div>

        <div className="border-t border-border p-4">
          <div className="mb-2 flex flex-col items-start gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-lg border border-border px-2 py-1 text-left text-xs text-muted-foreground hover:bg-accent"
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
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <Button type="submit" size="icon">
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      </div>

      {open && (
        <button
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px]"
          aria-label="Close chat overlay"
        />
      )}
    </>
  );
}
