"use client";

import { AlertTriangleIcon, RotateCwIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { type MessageMotionVariant, useMessageMotion } from "./messageMotion";
import type { ChatMessage } from "./types";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  motionVariant?: MessageMotionVariant;
  onRetry?: (id: string) => void;
  retryDisabled?: boolean;
}

export function ChatMessageBubble({
  message,
  motionVariant = "entrance",
  onRetry,
  retryDisabled,
}: ChatMessageBubbleProps) {
  const { variantFor, citationTransition } = useMessageMotion();
  const { variants, transition, initial } = variantFor(motionVariant);

  const citations = message.role === "assistant" ? message.citations : [];

  const bubble = (() => {
    if (message.role === "user") {
      return (
        <div className=" flex justify-end">
          <div className="bg-white max-w-11/12 p-sm type-small border border-grey-200 text-black dark:bg-grey-900 dark:border-grey-700 dark:text-grey-200">
            {message.text}
          </div>
        </div>
      );
    }

    if (message.role === "assistant-refusal") {
      return (
        <div className="flex justify-start">
          <div
            role="status"
            className="flex max-w-11/12 items-start gap-sm border border-refusal-border bg-refusal-background p-sm text-small text-refusal-foreground"
          >
            <AlertTriangleIcon aria-hidden="true" className="mt-1 size-md shrink-0" strokeWidth={1.75} />
            <span>{message.text}</span>
          </div>
        </div>
      );
    }

    if (message.role === "assistant-error") {
      return (
        <div className="flex justify-start">
          <div
            role="alert"
            className="flex max-w-11/12 flex-col items-start gap-sm border border-error-border bg-error-background p-sm text-small text-error-foreground"
          >
            <div className="flex items-start gap-sm">
              <AlertTriangleIcon aria-hidden="true" className="mt-1 size-md shrink-0" strokeWidth={1.75} />
              <div className="flex flex-col gap-sm">
                <span>{message.text}</span>
                {onRetry && (
                  <button
                    type="button"
                    onClick={() => onRetry(message.id)}
                    disabled={retryDisabled}
                    className="inline-flex items-center font-medium disabled:opacity-40"
                    data-cursor="link"
                  >
                    Retry
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex justify-start" data-testid="assistant-bubble">
        <div className="space-y-md max-w-11/12">
          <div className="type-small text-black dark:text-white">{message.text}</div>
          <AnimatePresence initial={false}>
            {citations.length > 0 && (
              <motion.div
                key="citations"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={citationTransition}
                className="flex flex-wrap gap-xs"
              >
                {citations.map((citation) => (
                  <a
                    key={`${citation.href}-${citation.label}`}
                    href={citation.href}
                    className="border border-grey-200 p-xs type-caption text-grey-700 bg-white hover:bg-grey-200 hover:text-black dark:bg-grey-900 dark:border-grey-700 dark:text-grey-200 dark:hover:bg-grey-800 dark:hover:text-white transition-colors duration-200 ease-in-out"
                    data-cursor="link"
                  >
                    {citation.label}
                  </a>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  })();

  return (
    <motion.div
      variants={variants}
      initial={initial}
      animate="visible"
      exit="exit"
      transition={transition}
    >
      {bubble}
    </motion.div>
  );
}
