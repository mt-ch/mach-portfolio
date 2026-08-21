"use client";

import { useCallback, useRef, useState } from "react";

import type { ChatCitation } from "@/lib/chat/types";

import {
  clearStoredMessages,
  getOrCreateSessionId,
  loadStoredMessages,
  saveStoredMessages,
  toHistoryTurns,
} from "./chatSession";
import type { ChatMessage } from "./types";

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
        // Drop any not-yet-answered placeholder, so a reload never
        // rehydrates a permanently blank bubble for a request that was
        // in flight when the tab closed.
        saveStoredMessages(
          next.filter((m) => !(m.role === "assistant" && m.text === "" && m.citations.length === 0)),
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

  const removeMessage = useCallback(
    (id: string) => {
      applyUpdate((prev) => prev.filter((m) => m.id !== id));
    },
    [applyUpdate],
  );

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isThinking) return;

      if (sessionIdRef.current === null) {
        sessionIdRef.current = getOrCreateSessionId();
      }
      const sessionId = sessionIdRef.current;

      const historyTurns = toHistoryTurns(messagesRef.current);

      const userId = `${Date.now()}-user`;
      const assistantId = `${Date.now()}-assistant`;

      applyUpdate((prev) => [
        ...prev,
        { id: userId, role: "user", text: trimmed },
        { id: assistantId, role: "assistant", text: "", citations: [] },
      ]);
      setIsThinking(true);

      const controller = new AbortController();
      abortRef.current = controller;

      void (async () => {
        try {
          const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ message: trimmed, history: historyTurns, sessionId }),
            signal: controller.signal,
          });

          if (!response.ok || !response.body) {
            setIsThinking(false);
            removeMessage(assistantId);
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
                }
              }

              boundary = buffer.indexOf("\n\n");
            }
          }
        } catch {
          if (controller.signal.aborted) return;
          setIsThinking(false);
          removeMessage(assistantId);
        }
      })();
    },
    [isThinking, applyUpdate, appendDelta, setDeltaCitations, replaceWithRefusal, removeMessage],
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

  return { messages, isThinking, hasStarted, send, reset };
}
