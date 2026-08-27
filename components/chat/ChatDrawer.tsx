"use client";

import { useEffect, useRef, useState } from "react";

import { ArrowUpIcon, RotateCwIcon, XIcon } from "lucide-react";

import { ChatLoadingIndicator } from "./ChatLoadingIndicator";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { SUGGESTED_QUESTIONS } from "./suggestedQuestions";
import { isEmptyAssistantMessage } from "./types";
import { useChatConversation } from "./useChatConversation";
import type { DrawerMode } from "./useDrawerVisibility";

interface ChatDrawerProps {
  isOpen: boolean;
  mode: DrawerMode;
  isMounted: boolean;
  isVisible: boolean;
  onClose: () => void;
}

export function ChatDrawer({ isOpen, mode, isMounted, isVisible, onClose }: ChatDrawerProps) {
  const { messages, isThinking, hasStarted, send, retry, reset } = useChatConversation();
  const [draft, setDraft] = useState("");
  const messagesRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = messagesRef.current;
    if (isOpen && el && typeof el.scrollTo === "function") {
      el.scrollTo({ top: el.scrollHeight });
    }
  }, [isOpen, messages, isThinking]);

  // In overlay mode the launcher toggle unmounts the instant the drawer
  // opens (see ChatDrawerToggle), which would otherwise drop focus to
  // <body>. Move focus into the panel so keyboard/screen-reader users land
  // somewhere useful instead of losing their place.
  useEffect(() => {
    if (isOpen) closeButtonRef.current?.focus();
  }, [isOpen]);

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
                ? `fixed inset-x-0 bottom-0 top-0 z-30 flex w-full flex-col bg-grey-100 dark:bg-grey-800 transition-transform duration-300 ease-out ${
                    isVisible ? "translate-x-0" : "translate-x-full"
                  }`
                : `ml-auto flex h-full w-102 flex-col border-l border-grey-200 bg-grey-100 dark:bg-grey-800 dark:border-grey-700`
            }
          >
            <div role="status" aria-live="polite" className="sr-only">
              {isThinking && "Thinking…"}
            </div>

            <div className="px-md py-md border-b border-grey-200 flex items-center justify-between gap-sm dark:border-grey-700">
              <p className="type-body font-medium text-brand">[Ask]</p>
              <div className="flex items-center gap-xs">
                <button
                  type="button"
                  onClick={onReset}
                  aria-label="Reset conversation"
                  className="inline-flex items-center justify-center bg-grey-200 text-grey-700 dark:bg-grey-700 dark:text-grey-200 text-small font-medium size-10 px-sm transition-transform duration-300 ease-out cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={isThinking || !hasStarted}
                >
                  <RotateCwIcon className="size-md shrink-0" strokeWidth={1.75} />
                </button>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={onClose}
                  aria-label="Close chat panel"
                  className="inline-flex items-center justify-center bg-grey-200 text-grey-700 dark:bg-grey-700 dark:text-grey-200 text-small font-medium size-10 px-sm transition-transform duration-300 ease-out cursor-pointer"
                >
                  <XIcon className="size-md shrink-0" strokeWidth={1.75} />
                </button>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col justify-between">
              <div ref={messagesRef} className="flex min-h-0 flex-1 flex-col gap-lg overflow-y-auto p-md">
                {hasStarted ? (
                  <>
                    {messages
                      // Hide only the in-flight placeholder — a message that
                      // finished with genuinely empty content (no delta, no
                      // citations) still renders once isThinking clears, so
                      // it never just vanishes with no feedback.
                      .filter((message, index) => !(isThinking && index === messages.length - 1 && isEmptyAssistantMessage(message)))
                      .map((message) => (
                        <ChatMessageBubble key={message.id} message={message} onRetry={retry} retryDisabled={isThinking} />
                      ))}
                    {isThinking && <ChatLoadingIndicator />}
                  </>
                ) : (
                  <div className="flex min-h-full flex-col justify-end gap-md">
                    <p className="type-body font-medium text-black dark:text-white">Hey, ask away.</p>
                    <div className="flex flex-col gap-md">
                      {SUGGESTED_QUESTIONS.map((question) => (
                        <button
                          key={question}
                          type="button"
                          onClick={() => onSuggestedQuestion(question)}
                          disabled={isThinking}
                          className="inline-flex items-start gap-xs text-left text-grey-500 dark:text-grey-400 disabled:opacity-40 hover:text-brand transition-all duration-200"
                        >
                          <span className="type-small">{question}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-md pb-md">
                <form
                  onSubmit={onSubmit}
                  className="relative flex items-center justify-between border border-grey-200 bg-white dark:bg-grey-900 dark:border-grey-700"
                >
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
                    className="type-small w-full p-sm text-black placeholder:text-grey-700 dark:text-white dark:placeholder:text-grey-400 auto-grow-textarea focus:outline-none"
                    autoComplete="off"
                    rows={1}
                  />
                  <div className="pr-xs py-xs flex justify-start h-full">
                    <button
                      type="submit"
                      disabled={!draft.trim() || isThinking}
                      aria-label="Send"
                      className="inline-flex items-center justify-center hover:bg-brand/80 bg-brand size-10 px-sm text-white transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ArrowUpIcon className="size-md shrink-0" strokeWidth={1.75} />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
