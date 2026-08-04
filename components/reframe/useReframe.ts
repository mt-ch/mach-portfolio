"use client";

import { useCallback, useRef, useState } from "react";

import type { CopyEvent, SelectionEvent } from "@/lib/reframe/cannedReframe";

export type ReframeStatus = "input" | "selecting" | "selected" | "done" | "fallback";

const OUTER_TIMEOUT_MS = 8000;

export function useReframe() {
  const [status, setStatus] = useState<ReframeStatus>("input");
  const [intent, setIntent] = useState("");
  const [selection, setSelection] = useState<SelectionEvent | null>(null);
  const [copy, setCopy] = useState<CopyEvent | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const clearTimer = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  };

  const reset = useCallback(() => {
    clearTimer();
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("input");
    setIntent("");
    setSelection(null);
    setCopy(null);
  }, []);

  const submit = useCallback((text: string) => {
    clearTimer();
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIntent(text);
    setSelection(null);
    setCopy(null);
    setStatus("selecting");

    timeoutRef.current = setTimeout(() => {
      controller.abort();
      setStatus("fallback");
    }, OUTER_TIMEOUT_MS);

    void (async () => {
      try {
        const response = await fetch("/api/reframe", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ intent: text }),
          signal: controller.signal,
        });

        if (!response.ok || !response.body) {
          clearTimer();
          setStatus("fallback");
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
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

              if (eventName === "selection") {
                setSelection(data);
                setStatus("selected");
              } else if (eventName === "copy") {
                setCopy(data);
                setStatus("done");
                clearTimer();
              }
            }

            boundary = buffer.indexOf("\n\n");
          }
        }
      } catch {
        if (controller.signal.aborted) return;
        clearTimer();
        setStatus("fallback");
      }
    })();
  }, []);

  return { status, intent, selection, copy, submit, reset };
}
