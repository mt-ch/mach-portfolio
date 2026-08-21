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
    const tween = gsap.fromTo(panel, { xPercent: 100 }, { xPercent: 0, duration: 0.35, ease: "power2.out" });
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
      {!isOpen && (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-label="Open chat"
          className="fixed bottom-md right-md z-40 inline-flex items-center gap-sm rounded-full bg-black px-md py-sm shadow-lg"
        >
          <span className="type-small font-medium text-white">Ask Matt LLM</span>
        </button>
      )}

      {mode === "overlay" && isOpen && (
        <div aria-hidden="true" data-testid="chat-drawer-backdrop" onClick={onClose} className="fixed inset-0 z-20 bg-black/40" />
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
              ? "fixed inset-x-0 bottom-0 top-16 z-30 flex w-full flex-col bg-grey-100"
              : "relative z-20 flex h-full w-124 shrink-0 flex-col border-l border-grey-200 bg-grey-100"
          }
        >
          <div role="status" aria-live="polite" className="sr-only">
            {isThinking && "Thinking…"}
          </div>

          <div className="p-md border-b border-grey-200 flex items-center justify-between gap-sm">
            <p className="type-body font-medium text-black">Matt LLM</p>
            <div className="flex items-center gap-xs">
              <button
                type="button"
                onClick={onReset}
                aria-label="Reset conversation"
                className="inline-flex items-center justify-center hover:bg-grey-200 size-lg p-xs rounded-full hover:text-grey-400 text-grey-300 transition-all duration-200"
              >
                <RotateCwIcon className="" strokeWidth={1.75} />
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close chat panel"
                className="inline-flex items-center justify-center hover:bg-grey-200 size-lg p-xs rounded-full hover:text-grey-400 text-grey-300 transition-all duration-200"
              >
                <XIcon className="" strokeWidth={1.75} />
              </button>
            </div>
          </div>

          <div className="p-md flex flex-1 flex-col justify-between gap-md">
            <div ref={messagesRef} className="flex flex-1 flex-col gap-md">
              {messages.map((message) => (
                <ChatMessageBubble key={message.id} message={message} />
              ))}
              {isThinking && <ChatTypingIndicator />}

              <div className="flex flex-col gap-2xs border-t border-grey-200 pt-md">
                {SUGGESTED_QUESTIONS.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => onSuggestedQuestion(question)}
                    disabled={isThinking}
                    className="inline-flex items-start gap-sm rounded-sm text-left text-grey-300 disabled:opacity-40 hover:bg-brand hover:text-accent -mx-sm transition-all duration-200"
                  >
                    <div className="flex items-start gap-sm p-sm">
                      <CornerDownRightIcon className="size-md shrink-0 mt-2xs" strokeWidth={1.75} />
                      <span className="type-body">{question}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={onSubmit} className="flex items-center justify-between border border-grey-200 bg-white">
              <label htmlFor="chat-drawer-input" className="sr-only">
                Hey, ask away.
              </label>
              <textarea
                id="chat-drawer-input"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask about Matt..."
                className="type-body w-full p-sm text-black placeholder:text-grey-300 auto-grow-textarea focus:outline-none"
                autoComplete="off"
                rows={1}
              />
              <div className="p-sm flex items-start justify-start h-full">
                <button
                  type="submit"
                  disabled={!draft.trim() || isThinking}
                  aria-label="Send"
                  className="inline-flex items-center justify-center hover:bg-brand/80 bg-brand size-lg p-xs rounded-full text-accent transition-all duration-200 disabled:opacity-40"
                >
                  <ArrowUpIcon strokeWidth={1.75} />
                </button>
              </div>
            </form>
          </div>
        </aside>
      )}
    </>
  );
}
