"use client";

import { useEffect, useRef, useState } from "react";

import gsap from "gsap";
import { ArrowUpIcon, CornerDownRightIcon, RotateCwIcon, XIcon } from "lucide-react";

import { ChatMessageBubble, ChatTypingIndicator } from "./ChatMessageBubble";
import { SUGGESTED_QUESTIONS } from "./suggestedQuestions";
import { useChatConversation } from "./useChatConversation";
import type { DrawerMode } from "./useDrawerVisibility";

interface ChatDrawerProps {
  isOpen: boolean;
  mode: DrawerMode;
  onClose: () => void;
  onToggle: () => void;
}

export function ChatDrawer({ isOpen, mode, onClose, onToggle }: ChatDrawerProps) {
  const { messages, isThinking, send, reset } = useChatConversation();
  const [draft, setDraft] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  // Entrance only — the panel unmounts immediately on close so closing
  // behavior stays deterministic for tests; only the slide-in is animated.
  useEffect(() => {
    const panel = panelRef.current;
    if (!isOpen || !panel) return;
    const tween = gsap.fromTo(
      panel,
      { xPercent: 100 },
      { xPercent: 0, duration: 0.35, ease: "power2.out" },
    );
    return () => {
      tween.kill();
    };
  }, [isOpen]);

  useEffect(() => {
    const el = messagesRef.current;
    if (isOpen && el && typeof el.scrollTo === "function") {
      el.scrollTo({ top: el.scrollHeight });
    }
  }, [isOpen, messages, isThinking]);

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim() || isThinking) return;
    send(draft);
    setDraft("");
  };

  const onSuggestedQuestion = (question: string) => {
    if (isThinking) return;
    send(question);
  };

  const onReset = () => {
    reset();
    setDraft("");
  };

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        className="fixed bottom-md right-md z-40 inline-flex items-center gap-sm rounded-full bg-black px-md py-sm shadow-lg dark:bg-white"
      >
        <span className="type-small font-medium text-white dark:text-black">
          {isOpen ? "Close" : "Ask Matt LLM"}
        </span>
      </button>

      {mode === "overlay" && isOpen && (
        <div
          aria-hidden="true"
          data-testid="chat-drawer-backdrop"
          onClick={onClose}
          className="fixed inset-0 z-20 bg-black/40"
        />
      )}

      {isOpen && (
        <aside
          ref={panelRef}
          role="dialog"
          aria-label="Chat with Matt"
          className={
            // Overlay mode leaves a top strip uncovered so the dimmed
            // backdrop behind it is a real, tappable region rather than
            // being fully painted over by this opaque full-width panel.
            mode === "overlay"
              ? "fixed inset-x-0 bottom-0 top-16 z-30 flex w-full flex-col bg-grey-100 dark:bg-grey-400"
              : "relative z-20 flex h-full w-124 shrink-0 flex-col border-l border-grey-200 bg-grey-100 dark:bg-grey-400"
          }
        >
          <div role="status" aria-live="polite" className="sr-only">
            {isThinking && "Thinking…"}
          </div>

          <div className="p-md border-b border-grey-200 flex items-center justify-between gap-sm">
            <p className="type-body font-medium text-black dark:text-white">Matt LLM</p>
            <div className="flex items-center gap-md">
              <button
                type="button"
                onClick={onReset}
                aria-label="Reset conversation"
                className="inline-flex items-center gap-sm"
              >
                <RotateCwIcon className="size-md text-grey-300" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close chat panel"
                className="inline-flex items-center gap-sm"
              >
                <XIcon className="size-md text-grey-300" strokeWidth={1.75} />
              </button>
            </div>
          </div>

          <div className="p-md flex flex-1 flex-col justify-between gap-md overflow-hidden">
            <div ref={messagesRef} className="flex flex-1 flex-col gap-md overflow-y-auto">
              {messages.map((message) => (
                <ChatMessageBubble key={message.id} message={message} />
              ))}
              {isThinking && <ChatTypingIndicator />}

              <div className="flex flex-col gap-sm border-t border-grey-200 pt-md">
                {SUGGESTED_QUESTIONS.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => onSuggestedQuestion(question)}
                    disabled={isThinking}
                    className="inline-flex items-center gap-sm text-left disabled:opacity-40"
                  >
                    <CornerDownRightIcon
                      className="size-md shrink-0 text-grey-300"
                      strokeWidth={1.75}
                    />
                    <span className="type-body text-grey-300">{question}</span>
                  </button>
                ))}
              </div>
            </div>

            <form
              onSubmit={onSubmit}
              className="flex items-center justify-between border border-grey-200 bg-white"
            >
              <label htmlFor="chat-drawer-input" className="sr-only">
                Ask about Matt&apos;s projects, experience, or background
              </label>
              <input
                id="chat-drawer-input"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask about Matt..."
                className="type-body w-full p-sm text-black placeholder:text-grey-300"
              />
              <button
                type="submit"
                disabled={!draft.trim() || isThinking}
                aria-label="Send"
                className="inline-flex items-center gap-sm p-sm disabled:opacity-40"
              >
                <ArrowUpIcon className="size-md text-grey-300" strokeWidth={1.75} />
              </button>
            </form>
          </div>
        </aside>
      )}
    </>
  );
}
