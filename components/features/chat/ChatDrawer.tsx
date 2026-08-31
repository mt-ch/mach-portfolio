"use client";

import { useEffect, useRef, useState } from "react";

import { ArrowUpIcon, RotateCwIcon, XIcon } from "lucide-react";
import { AnimatePresence, motion, useIsPresent, usePresence } from "motion/react";

import { ChatLoadingIndicator } from "./ChatLoadingIndicator";
import { ChatMessageBubble } from "./ChatMessageBubble";
import { drawerTransitionMs } from "./motionTiming";
import {
  type ConversationTransitionDirection,
  type MessageMotionVariant,
  useConversationDissolve,
  useMessageMotion,
} from "./messageMotion";
import { SUGGESTED_QUESTIONS } from "./suggestedQuestions";
import { isEmptyAssistantMessage } from "./types";
import { useChatConversation } from "./useChatConversation";
import type { DrawerMode } from "./useDrawerVisibility";

interface ChatDrawerProps {
  mode: DrawerMode;
  onClose: () => void;
}

export function ChatDrawer({ mode, onClose }: ChatDrawerProps) {
  // Presence is owned here: ChatShell renders <ChatDrawer> inside
  // <AnimatePresence> only while the drawer is open, and usePresence keeps
  // this component mounted through its exit so the CSS slide-out is visible.
  const [isPresent, safeToRemove] = usePresence();
  const { messages, isThinking, hasStarted, send, retry, reset } = useChatConversation();
  const { reduced, durationBase, durationFast, variantFor } = useMessageMotion();
  const [draft, setDraft] = useState("");
  // Snapshot ids present when this drawer instance mounts so restored
  // history never plays an entrance animation on open.
  const [initialMessageIds] = useState(() => new Set(messages.map((message) => message.id)));
  // Mount in the closed visual state, then flip a frame later so the CSS
  // shell transition has a "from" state to animate out of.
  const [isVisible, setIsVisible] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Track presence so the shell transition reverses the moment
  // AnimatePresence flags this for removal (before the exit-delay effect
  // below releases the node), and re-opens if an exit is interrupted by
  // the drawer being reopened before it finishes leaving.
  const [wasPresent, setWasPresent] = useState(isPresent);
  if (isPresent !== wasPresent) {
    setWasPresent(isPresent);
    setIsVisible(isPresent);
  }

  // Landing <-> conversation cross-dissolve (issue #136): asking the first
  // question vs. resetting pick different fade durations (see
  // useConversationDissolve). Detected the same way wasPresent is above:
  // compare against the previous render's value directly during render.
  const [wasStarted, setWasStarted] = useState(hasStarted);
  const [conversationDirection, setConversationDirection] = useState<ConversationTransitionDirection>("forward");
  if (hasStarted !== wasStarted) {
    setWasStarted(hasStarted);
    setConversationDirection(hasStarted ? "forward" : "reset");
  }
  const conversationDissolve = useConversationDissolve(reduced, durationBase, durationFast);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (isPresent) return;
    // Hold the node through the CSS slide-out, then release it — timed off
    // the same motion token the CSS transition uses.
    const timeout = setTimeout(() => safeToRemove?.(), drawerTransitionMs());
    return () => clearTimeout(timeout);
  }, [isPresent, safeToRemove]);

  useEffect(() => {
    const el = messagesRef.current;
    if (el && typeof el.scrollTo === "function") {
      el.scrollTo({ top: el.scrollHeight });
    }
  }, [messages, isThinking]);

  // In overlay mode the launcher toggle unmounts the instant the drawer
  // opens (see ChatDrawerToggle), which would otherwise drop focus to
  // <body>. Move focus into the panel so keyboard/screen-reader users land
  // somewhere useful instead of losing their place.
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

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

  const pendingAssistantId =
    isThinking &&
    messages.length > 0 &&
    messages[messages.length - 1].role === "assistant" &&
    isEmptyAssistantMessage(messages[messages.length - 1])
      ? messages[messages.length - 1].id
      : null;

  function motionVariantForMessage(message: (typeof messages)[number]): MessageMotionVariant {
    if (message.role === "assistant-error" || message.role === "assistant-refusal") {
      return "flat";
    }
    if (initialMessageIds.has(message.id)) {
      return "none";
    }
    // New assistant bubbles always replace the loading indicator at the same
    // anchor, so they crossfade in rather than playing a separate rise.
    if (message.role === "assistant") {
      return "crossfade";
    }
    return "entrance";
  }

  const loadingMotion = variantFor("crossfade");

  return (
    <>
      {mode === "overlay" && (
        <div
          aria-hidden="true"
          data-testid="chat-drawer-backdrop"
          onClick={onClose}
          className={`fixed inset-0 z-20 bg-black/40 transition-opacity duration-[var(--duration-slow)] ease-out motion-reduce:duration-[var(--duration-fast)] ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      <div
        className={
          // push mode: the panel's own width easing between closed and open
          // opens the layout gap. Under reduced motion the width snaps and a
          // short opacity change stands in for the movement.
          mode === "push"
            ? `relative z-20 h-full shrink-0 overflow-hidden transition-[width] duration-[var(--duration-slow)] ease-out motion-reduce:transition-opacity motion-reduce:duration-[var(--duration-fast)] ${
                isVisible ? "w-102 opacity-100" : "w-0 opacity-0"
              }`
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
            // Reduced motion: no translate, just a short opacity change.
            mode === "overlay"
              ? `fixed inset-x-0 bottom-0 top-0 z-30 flex w-full flex-col bg-grey-100 dark:bg-grey-800 transition-transform duration-[var(--duration-slow)] ease-out motion-reduce:transition-opacity motion-reduce:duration-[var(--duration-fast)] motion-reduce:translate-x-0 ${
                  isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
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
                className="inline-flex items-center justify-center bg-grey-200 text-grey-700 dark:bg-grey-700 dark:text-grey-200 text-small font-medium size-10 px-sm transition-transform duration-[var(--duration-slow)] ease-out cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                disabled={isThinking || !hasStarted}
                data-cursor="button"
              >
                <RotateCwIcon className="size-md shrink-0" strokeWidth={1.75} />
              </button>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label="Close chat panel"
                className="inline-flex items-center justify-center bg-grey-200 text-grey-700 dark:bg-grey-700 dark:text-grey-200 text-small font-medium size-10 px-sm transition-transform duration-[var(--duration-slow)] ease-out cursor-pointer lg:hidden"
                data-cursor="button"
              >
                <XIcon className="size-md shrink-0" strokeWidth={1.75} />
              </button>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col justify-between">
            <div className="relative min-h-0 flex-1">
              <AnimatePresence initial={false} custom={conversationDirection}>
                {hasStarted ? (
                  <CrossDissolvePane
                    key="conversation"
                    variants={conversationDissolve.variants}
                    scrollRef={messagesRef}
                    className="flex flex-col gap-lg p-md"
                  >
                    <AnimatePresence initial={false}>
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
                          <ChatMessageBubble
                            key={`${message.id}-${message.role}`}
                            message={message}
                            motionVariant={motionVariantForMessage(message)}
                            onRetry={retry}
                            retryDisabled={isThinking}
                          />
                        ))}
                      {pendingAssistantId && (
                        <motion.div
                          key={`loading-${pendingAssistantId}`}
                          variants={loadingMotion.variants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          transition={loadingMotion.transition}
                        >
                          <ChatLoadingIndicator reducedMotion={reduced} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CrossDissolvePane>
                ) : (
                  <CrossDissolvePane
                    key="landing"
                    variants={conversationDissolve.variants}
                    className="flex min-h-full flex-col justify-end gap-md p-md"
                  >
                    <p className="type-body font-medium text-black dark:text-white">Hey, ask away.</p>
                    <div className="flex flex-col gap-md">
                      {SUGGESTED_QUESTIONS.map((question) => (
                        <button
                          key={question}
                          type="button"
                          onClick={() => onSuggestedQuestion(question)}
                          disabled={isThinking}
                          className="inline-flex items-start gap-xs text-left text-grey-500 dark:text-grey-400 disabled:opacity-40 hover:text-brand transition-all duration-200"
                          data-cursor="link"
                        >
                          <span className="type-small">{question}</span>
                        </button>
                      ))}
                    </div>
                  </CrossDissolvePane>
                )}
              </AnimatePresence>
            </div>

            <div className="px-md pb-md">
              <form
                onSubmit={onSubmit}
                className="relative flex items-center justify-between border border-grey-200 bg-white dark:bg-grey-900 dark:border-grey-700"
              >
                <label htmlFor="chat-drawer-input" className="sr-only">
                  Hey, ask away.
                </label>
                {/* The height ease sits on the textarea, not the bordered
                    form around it: field-sizing still picks every height, and
                    the form's own auto height re-lays out each frame to
                    follow, so its border never lags behind the text. */}
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
                  className="type-small w-full p-sm text-black placeholder:text-grey-700 dark:text-white dark:placeholder:text-grey-400 auto-grow-textarea focus:outline-none transition-[height] duration-[var(--duration-fast)] ease-out motion-reduce:transition-none"
                  autoComplete="off"
                  rows={1}
                />
                <div className="pr-xs py-xs flex justify-start h-full">
                  <button
                    type="submit"
                    disabled={!draft.trim() || isThinking}
                    aria-label="Send"
                    className="inline-flex items-center justify-center hover:bg-brand/80 bg-brand size-10 px-sm text-white transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                    data-cursor="button"
                  >
                    <ArrowUpIcon className="size-md shrink-0" strokeWidth={1.75} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

interface CrossDissolvePaneProps {
  variants: ReturnType<typeof useConversationDissolve>["variants"];
  // Only the conversation pane needs to be found again for auto-scroll.
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  className: string;
  children: React.ReactNode;
}

// One half of the landing/conversation cross-dissolve (issue #136). Always
// absolutely positioned with its own scroll, rather than only while its
// counterpart is also mounted: an exiting pane's *props* freeze at whatever
// they were the last time AnimatePresence actually rendered it, so a flag
// flipped only at swap-start would already be stale by the time this pane is
// the one leaving. Overlaying unconditionally sidesteps that entirely, and
// giving each pane its own overflow-y-auto (rather than the shared
// scroll-area div) means a long conversation still scrolls normally with no
// dependency on swap state.
function CrossDissolvePane({ variants, scrollRef, className, children }: CrossDissolvePaneProps) {
  // useIsPresent, not usePresence: usePresence's subscription opts the
  // component out of AnimatePresence's automatic unmount-after-exit, which
  // would leave the outgoing pane sitting in the DOM at opacity 0 forever.
  const isPresent = useIsPresent();
  return (
    <motion.div
      ref={scrollRef}
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      style={{ pointerEvents: isPresent ? "auto" : "none" }}
      // aria-hidden and inert together take the outgoing pane out of the
      // accessibility tree and out of tab order the moment it starts
      // leaving, so a focused Retry button (say) can't still be reached or
      // activated by keyboard/AT while it's mid-fade over a conversation
      // that's already been cleared.
      aria-hidden={!isPresent}
      inert={!isPresent}
      className={`absolute inset-0 overflow-y-auto ${className}`}
    >
      {children}
    </motion.div>
  );
}
