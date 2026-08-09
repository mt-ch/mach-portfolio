"use client";

import { useCallback, useRef, useState } from "react";

import type { ValidatedCopy } from "@/lib/guardrails/validate";
import type { SelectionEvent } from "@/lib/reframe/cannedReframe";

// The server streams validated copy, so any surface that failed its length
// bounds arrives as null and the original site copy stands.
export type CopyEvent = ValidatedCopy;

export type ReframeStatus = "input" | "selecting" | "selected" | "done" | "fallback";

// Budget per SSE event, not for the whole request. Measured against the live
// two-call pipeline, the selection event alone lands at 6-8s, so the original
// 8s total was tripping on healthy requests; this leaves headroom over that
// while still failing a genuinely dead request in a reasonable time.
export const OUTER_TIMEOUT_MS = 15000;

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

    // The budget is time-since-last-progress, not time-for-the-whole-pipeline:
    // the two-call server pipeline outruns any single deadline, but a genuinely
    // dead request still produces no event and trips the timer.
    const armTimer = () => {
      clearTimer();
      timeoutRef.current = setTimeout(() => {
        controller.abort();
        setStatus("fallback");
      }, OUTER_TIMEOUT_MS);
    };

    armTimer();

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
        let sawSelection = false;
        let sawCopy = false;

        for (;;) {
          const { done, value } = await reader.read();
          if (done) {
            clearTimer();
            // Generation can fail after selection already streamed; the
            // tailored ordering still stands, and each copy surface falls
            // back to the original on its own.
            if (!sawCopy) setStatus(sawSelection ? "done" : "fallback");
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

              if (eventName === "selection") {
                sawSelection = true;
                setSelection(data);
                setStatus("selected");
                armTimer();
              } else if (eventName === "copy") {
                sawCopy = true;
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
