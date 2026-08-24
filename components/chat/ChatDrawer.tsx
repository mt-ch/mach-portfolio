"use client";

import { useEffect, useRef, useState } from "react";

import { ArrowUpIcon, CornerDownRightIcon, RotateCwIcon, XIcon } from "lucide-react";

import { ChatLoadingIndicator } from "./ChatLoadingIndicator";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { SUGGESTED_QUESTIONS } from "./suggestedQuestions";
import { isEmptyAssistantMessage } from "./types";
import { useChatConversation } from "./useChatConversation";
import type { DrawerMode } from "./useDrawerVisibility";

// Keep in sync with the duration-300 transition classes below — the panel
// stays mounted for this long after close so the slide-out (and, in push
// mode, the main-content resize) can finish before it's removed.
const TRANSITION_MS = 300;

interface ChatDrawerProps {
  isOpen: boolean;
  mode: DrawerMode;
  onClose: () => void;
  onToggle: () => void;
}

type Phase = "closed" | "opening" | "open" | "closing";

export function ChatDrawer({ isOpen, mode, onClose, onToggle }: ChatDrawerProps) {
  const { messages, isThinking, hasStarted, send, retry, reset } = useChatConversation();
  const [draft, setDraft] = useState("");
  const messagesRef = useRef<HTMLDivElement>(null);

  // Mount immediately on open (so the entrance transition has something to
  // animate from), then flip to "open" a frame later to trigger it. On
  // close, drop straight to "closing" (which reverses the transition) and
  // only unmount once the CSS transition has had time to finish, so the
  // slide-out is visible instead of the panel just vanishing.
  const [phase, setPhase] = useState<Phase>(isOpen ? "open" : "closed");
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    setPhase(isOpen ? "opening" : "closing");
  }

  useEffect(() => {
    if (phase === "opening") {
      const raf = requestAnimationFrame(() => setPhase("open"));
      return () => cancelAnimationFrame(raf);
    }
    if (phase === "closing") {
      const timeout = setTimeout(() => setPhase("closed"), TRANSITION_MS);
      return () => clearTimeout(timeout);
    }
  }, [phase]);

  const isMounted = phase !== "closed";
  const isVisible = phase === "open";

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
      {!isMounted && (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-label="Open chat"
          className="fixed top-md right-md z-10 inline-flex items-center gap-sm rounded-full bg-white px-sm py-xs mix-blend-difference"
        >
          <span className="type-small font-medium text-black">Ask me</span>
        </button>
      )}

      {mode === "overlay" && isMounted && (
        <div
          aria-hidden="true"
          data-testid="chat-drawer-backdrop"
          onClick={onClose}
          className={`fixed inset-0 z-20 bg-black/40 transition-opacity duration-300 ease-out ${isVisible ? "opacity-100" : "opacity-0"}`}
        />
      )}

      {isMounted && (
        <div
          className={
            mode === "push"
              ? `relative z-20 h-full shrink-0 overflow-hidden transition-[width] duration-300 ease-out ${isVisible ? "w-102" : "w-0"}`
              : undefined
          }
        >
          <aside
            role="dialog"
            aria-label="Chat with Matt"
            className={
              // Overlay mode leaves a top strip uncovered so the dimmed
              // backdrop behind it is a real, tappable region rather than
              // being fully painted over by this opaque full-width panel.
              mode === "overlay"
                ? `fixed inset-x-0 bottom-0 top-16 z-30 flex w-full flex-col bg-grey-100 transition-transform duration-300 ease-out ${
                    isVisible ? "translate-x-0" : "translate-x-full"
                  }`
                : `ml-auto flex h-full w-102 flex-col border-l border-grey-200 bg-grey-100`
            }
          >
            <div role="status" aria-live="polite" className="sr-only">
              {isThinking && "Thinking…"}
            </div>

            <div className="px-md py-sm border-b border-grey-200 flex items-center justify-between gap-sm">
              <p className="type-smal font-medium text-black">Matt LLM</p>
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

            <div className="p-md flex min-h-0 flex-1 flex-col justify-between gap-md">
              <div ref={messagesRef} className="flex min-h-0 flex-1 flex-col gap-md overflow-y-auto">
                {hasStarted ? (
                  <>
                    {messages
                      // Hide only the in-flight placeholder — a message that
                      // finished with genuinely empty content (no delta, no
                      // citations) still renders once isThinking clears, so
                      // it never just vanishes with no feedback.
                      .filter(
                        (message, index) =>
                          !(isThinking && index === messages.length - 1 && isEmptyAssistantMessage(message)),
                      )
                      .map((message) => (
                        <ChatMessageBubble key={message.id} message={message} onRetry={retry} retryDisabled={isThinking} />
                      ))}
                    {isThinking && <ChatLoadingIndicator />}
                  </>
                ) : (
                  <div className="flex min-h-full flex-col justify-end gap-md">
                    <p className="type-body font-medium text-black">Hey, ask away.</p>
                    <div className="flex flex-col gap-md">
                      {SUGGESTED_QUESTIONS.map((question) => (
                        <button
                          key={question}
                          type="button"
                          onClick={() => onSuggestedQuestion(question)}
                          disabled={isThinking}
                          className="inline-flex items-start gap-xs text-left text-grey-300 disabled:opacity-40 hover:text-brand transition-all duration-200"
                        >
                          <CornerDownRightIcon className="size-md shrink-0 mt-0.5" strokeWidth={1.75} />
                          <span className="type-small">{question}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={onSubmit} className="relative flex items-center justify-between border border-grey-200 bg-white">
                <label htmlFor="chat-drawer-input" className="sr-only">
                  Hey, ask away.
                </label>
                <textarea
                  id="chat-drawer-input"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }}
                  placeholder="Ask about Matt..."
                  className="type-small w-full p-sm text-black placeholder:text-grey-300 auto-grow-textarea focus:outline-none"
                  autoComplete="off"
                  rows={1}
                />
                <div className="pr-xs py-xs flex justify-start h-full">
                  <button
                    type="submit"
                    disabled={!draft.trim() || isThinking}
                    aria-label="Send"
                    className="inline-flex items-center justify-center hover:bg-brand/80 bg-brand size-lg p-xs text-accent transition-all duration-200 disabled:opacity-40"
                  >
                    <ArrowUpIcon strokeWidth={1.75} />
                  </button>
                </div>
              </form>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
