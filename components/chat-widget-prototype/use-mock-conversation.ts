"use client";

// PROTOTYPE — throwaway. Fakes a scripted conversation so the three UI
// variants can be judged on look/behavior without a real backend.
// See issue #40 (chat widget UI design).

import { useCallback, useState } from "react";

export type Citation = { label: string; href: string };

export type ChatMessage =
  | { id: string; role: "assistant-intro"; text: string }
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; text: string; citations: Citation[] }
  | { id: string; role: "assistant-refusal"; text: string };

type ScriptedTurn = {
  prompt: string;
  reply: Omit<Extract<ChatMessage, { role: "assistant" }>, "id" | "role"> & {
    role?: "assistant";
  };
};

const SCRIPT: ScriptedTurn[] = [
  {
    prompt: "What's Matt's experience with distributed systems?",
    reply: {
      text: "At Acme Corp, Matt led the migration from a monolith to a distributed, event-driven architecture handling ~40k events/sec — designing the partitioning scheme and the on-call runbooks that came with it.",
      citations: [
        { label: "Experience — Staff Engineer, Acme Corp", href: "#" },
      ],
    },
  },
  {
    prompt: "Which project best shows that?",
    reply: {
      text: "The Realtime Pipeline project is the clearest hands-on example — a from-scratch Kafka-based ingestion layer with backpressure-aware consumers.",
      citations: [{ label: "Project — Realtime Pipeline", href: "#" }],
    },
  },
];

const REFUSAL: ChatMessage = {
  id: "refusal",
  role: "assistant-refusal",
  text: "I can only answer questions about Matt's work, projects, and background — try asking about a project, his experience, or a specific skill.",
};

const OFF_TOPIC_PROMPT = "What's the weather like in SF today?";

const INTRO: ChatMessage = {
  id: "intro",
  role: "assistant-intro",
  text: "Hi — ask me anything about Matt's projects, experience, or background.",
};

export function useMockConversation() {
  const [messages, setMessages] = useState<ChatMessage[]>([INTRO]);
  const [isThinking, setIsThinking] = useState(false);
  const [turnIndex, setTurnIndex] = useState(0);

  const send = useCallback(
    (prompt: string) => {
      if (isThinking) return;
      const id = `${Date.now()}`;
      setMessages((prev) => [...prev, { id, role: "user", text: prompt }]);
      setIsThinking(true);

      window.setTimeout(() => {
        setIsThinking(false);
        if (prompt === OFF_TOPIC_PROMPT) {
          setMessages((prev) => [...prev, REFUSAL]);
          return;
        }
        const turn = SCRIPT[turnIndex];
        if (turn) {
          setMessages((prev) => [
            ...prev,
            { id: `${id}-reply`, role: "assistant", ...turn.reply },
          ]);
          setTurnIndex((i) => i + 1);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              id: `${id}-reply`,
              role: "assistant",
              text: "(prototype) That's the end of the scripted answers — try one of the suggestions above.",
              citations: [],
            },
          ]);
        }
      }, 900);
    },
    [isThinking, turnIndex]
  );

  const reset = useCallback(() => {
    setMessages([INTRO]);
    setTurnIndex(0);
    setIsThinking(false);
  }, []);

  const suggestions = [...SCRIPT.map((t) => t.prompt), OFF_TOPIC_PROMPT];

  return { messages, isThinking, send, reset, suggestions };
}
