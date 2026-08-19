"use client";

import { useEffect, useRef, useState } from "react";

import { ChatMessageBubble, ChatTypingIndicator } from "./ChatMessageBubble";
import { useChatConversation } from "./useChatConversation";

export function ChatWidget() {
  const { messages, isThinking, send, reset } = useChatConversation();
  const [draft, setDraft] = useState("");
  const [expanded, setExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (expanded && panel && typeof panel.scrollTo === "function") {
      panel.scrollTo({ top: panel.scrollHeight });
    }
  }, [expanded, messages, isThinking]);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // A send while already thinking is a silent no-op in the hook — guard
    // here too, so the draft the user typed isn't cleared for nothing.
    if (!draft.trim() || isThinking) return;
    setExpanded(true);
    send(draft);
    setDraft("");
  };

  const onReset = () => {
    reset();
    setDraft("");
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex flex-col items-center px-4">
      <div role="status" aria-live="polite" className="sr-only">
        {isThinking && "Thinking…"}
      </div>

      {expanded && (
        <div
          ref={panelRef}
          className="pointer-events-auto mb-3 flex h-[24rem] w-full max-w-lg flex-col overflow-hidden rounded-md border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-black"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-2.5 dark:border-gray-800">
            <span className="text-sm font-medium">Ask about Matt</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onReset}
                className="text-xs text-gray-400 underline hover:text-gray-600 dark:hover:text-gray-300"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                aria-label="Collapse conversation"
                className="rounded-full p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((message) => (
              <ChatMessageBubble key={message.id} message={message} />
            ))}
            {isThinking && <ChatTypingIndicator />}
          </div>
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="pointer-events-auto flex w-full max-w-lg items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2.5 shadow-xl dark:border-gray-800 dark:bg-black"
      >
        <label htmlFor="chat-widget-input" className="sr-only">
          Ask about Matt&apos;s projects, experience, or background
        </label>
        <input
          id="chat-widget-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onFocus={() => setExpanded(true)}
          placeholder="Ask about Matt's projects, experience, or background…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
        />
        <button
          type="submit"
          disabled={!draft.trim() || isThinking}
          aria-label="Send"
          className="flex size-7 shrink-0 items-center justify-center rounded-full bg-black text-white disabled:opacity-40 dark:bg-white dark:text-black"
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="size-4">
            <path
              fillRule="evenodd"
              d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </form>
    </div>
  );
}
