"use client";

import { useCallback, useRef, useState } from "react";

import type { ChatCitation } from "@/lib/chat/types";

import { errorMessageFor, type ChatErrorCause } from "./chatErrors";
import {
  clearStoredMessages,
  getOrCreateSessionId,
  loadStoredMessages,
  saveStoredMessages,
  toHistoryTurns,
} from "./chatSession";
import { isEmptyAssistantMessage, type ChatMessage } from "./types";

// No request should hang the typing indicator forever with no way out.
const REQUEST_TIMEOUT_MS = 25_000;

function initialMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  return loadStoredMessages();
}

export function useChatConversation() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isThinking, setIsThinking] = useState(false);
  const messagesRef = useRef<ChatMessage[]>(messages);
  const sessionIdRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const applyUpdate = useCallback(
    (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
      setMessages((prev) => {
        const next = updater(prev);
        messagesRef.current = next;
        // Drop any not-yet-answered placeholder and any error bubble, so a
        // reload never rehydrates a permanently blank or broken bubble left
        // over from an in-flight or failed request when the tab closed.
        saveStoredMessages(
          next.filter((m) => m.role !== "assistant-error" && !isEmptyAssistantMessage(m)),
        );
        return next;
      });
    },
    [],
  );

  const appendDelta = useCallback(
    (id: string, delta: string) => {
      applyUpdate((prev) =>
        prev.map((m) => (m.id === id && m.role === "assistant" ? { ...m, text: m.text + delta } : m)),
      );
    },
    [applyUpdate],
  );

  const setDeltaCitations = useCallback(
    (id: string, citations: ChatCitation[]) => {
      applyUpdate((prev) =>
        prev.map((m) => (m.id === id && m.role === "assistant" ? { ...m, citations } : m)),
      );
    },
    [applyUpdate],
  );

  const replaceWithRefusal = useCallback(
    (id: string, text: string) => {
      applyUpdate((prev) =>
        prev.map((m): ChatMessage => (m.id === id ? { id, role: "assistant-refusal", text } : m)),
      );
    },
    [applyUpdate],
  );

  const showError = useCallback(
    (assistantId: string, cause: ChatErrorCause, retryText: string, attempts: number) => {
      applyUpdate((prev) =>
        prev.map((m): ChatMessage =>
          m.id === assistantId
            ? { id: assistantId, role: "assistant-error", text: errorMessageFor(cause, attempts), cause, retryText, attempts }
            : m,
        ),
      );
      setIsThinking(false);
    },
    [applyUpdate],
  );

  const performRequest = useCallback(
    (trimmed: string, assistantId: string, attempt: number, historyTurns: ReturnType<typeof toHistoryTurns>) => {
      if (sessionIdRef.current === null) {
        sessionIdRef.current = getOrCreateSessionId();
      }
      const sessionId = sessionIdRef.current;

      const controller = new AbortController();
      abortRef.current = controller;
      const timeoutId = setTimeout(() => {
        controller.abort(new DOMException("Request timed out", "TimeoutError"));
      }, REQUEST_TIMEOUT_MS);

      return (async () => {
        try {
          const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ message: trimmed, history: historyTurns, sessionId }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (!response.ok || !response.body) {
            showError(assistantId, response.status === 429 ? "rate-limit" : "server", trimmed, attempt);
            return;
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          for (;;) {
            const { done, value } = await reader.read();
            if (done) {
              setIsThinking(false);
              break;
            }
            buffer += decoder.decode(value, { stream: true });

            let boundary = buffer.indexOf("\n\n");
            while (boundary !== -1) {
              const block = buffer.slice(0, boundary);
              buffer = buffer.slice(boundary + 2);

              const eventMatch = /^event: (.+)$/m.exec(block);
              const dataMatch = /^data: (.+)$/m.exec(block);
              if (eventMatch && dataMatch) {
                const eventName = eventMatch[1];
                const data = JSON.parse(dataMatch[1]);

                if (eventName === "delta") {
                  appendDelta(assistantId, data.text as string);
                } else if (eventName === "citations") {
                  setDeltaCitations(assistantId, data.citations as ChatCitation[]);
                  setIsThinking(false);
                } else if (eventName === "refusal") {
                  replaceWithRefusal(assistantId, data.message as string);
                  setIsThinking(false);
                } else if (eventName === "error") {
                  showError(assistantId, "server", trimmed, attempt);
                  return;
                }
              }

              boundary = buffer.indexOf("\n\n");
            }
          }
        } catch {
          clearTimeout(timeoutId);
          if (controller.signal.aborted) {
            const reason = controller.signal.reason;
            if (reason instanceof DOMException && reason.name === "TimeoutError") {
              showError(assistantId, "timeout", trimmed, attempt);
            }
            // Otherwise this is reset()'s deliberate abort — stop silently.
            return;
          }
          showError(assistantId, "network", trimmed, attempt);
        }
      })();
    },
    [appendDelta, setDeltaCitations, replaceWithRefusal, showError],
  );

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isThinking) return;

      // Computed before this turn's messages are pushed, so the current
      // message never leaks into its own history.
      const historyTurns = toHistoryTurns(messagesRef.current);

      const userId = `${Date.now()}-user`;
      const assistantId = `${Date.now()}-assistant`;

      applyUpdate((prev) => [
        ...prev,
        { id: userId, role: "user", text: trimmed },
        { id: assistantId, role: "assistant", text: "", citations: [] },
      ]);
      setIsThinking(true);

      void performRequest(trimmed, assistantId, 1, historyTurns);
    },
    [isThinking, applyUpdate, performRequest],
  );

  const retry = useCallback(
    (id: string) => {
      if (isThinking) return;
      const index = messagesRef.current.findIndex((m) => m.id === id);
      const message = messagesRef.current[index];
      if (!message || message.role !== "assistant-error") return;

      const nextAttempt = message.attempts + 1;
      const retryText = message.retryText;
      // Excludes this turn's own (failed) user message, same as send().
      const historyTurns = toHistoryTurns(messagesRef.current.slice(0, index));

      applyUpdate((prev) =>
        prev.map((m): ChatMessage => (m.id === id ? { id, role: "assistant", text: "", citations: [] } : m)),
      );
      setIsThinking(true);

      void performRequest(retryText, id, nextAttempt, historyTurns);
    },
    [isThinking, applyUpdate, performRequest],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    clearStoredMessages();
    messagesRef.current = [];
    setMessages([]);
    setIsThinking(false);
  }, []);

  const hasStarted = messages.some((m) => m.role === "user");

  return { messages, isThinking, hasStarted, send, retry, reset };
}
