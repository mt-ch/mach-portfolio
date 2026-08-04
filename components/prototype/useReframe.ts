"use client";

// PROTOTYPE — models the client-side state machine for issue #13, layered on
// top of the SSE contract from #10 (`selection` then `copy` events) and the
// timeout/fallback rules from #12 (8s outer bound, silent fallback, no
// retry). Fakes the two events with timers instead of a real EventSource.

import { useCallback, useRef, useState } from "react";

import {
  COPY_DELAY_MS,
  type CopyEvent,
  isSimulatedTimeout,
  mockReframe,
  OUTER_TIMEOUT_MS,
  SELECTION_DELAY_MS,
  type SelectionEvent,
} from "./reframePlaceholderData";

export type ReframeStatus =
  | "input"
  | "selecting"
  | "selected"
  | "done"
  | "fallback";

export function useReframe() {
  const [status, setStatus] = useState<ReframeStatus>("input");
  const [intent, setIntent] = useState("");
  const [selection, setSelection] = useState<SelectionEvent | null>(null);
  const [copy, setCopy] = useState<CopyEvent | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const submit = useCallback((text: string) => {
    clearTimers();
    setIntent(text);
    setSelection(null);
    setCopy(null);
    setStatus("selecting");

    const outer = setTimeout(() => {
      setStatus("fallback");
    }, OUTER_TIMEOUT_MS);
    timers.current.push(outer);

    if (isSimulatedTimeout(text)) return; // outer timeout is the only thing that fires

    const mock = mockReframe(text);
    timers.current.push(
      setTimeout(() => {
        setSelection(mock.selection);
        setStatus("selected");
      }, SELECTION_DELAY_MS),
    );
    timers.current.push(
      setTimeout(() => {
        setCopy(mock.copy);
        setStatus("done");
        clearTimeout(outer);
      }, COPY_DELAY_MS),
    );
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    setStatus("input");
    setIntent("");
    setSelection(null);
    setCopy(null);
  }, []);

  return { status, intent, selection, copy, submit, reset };
}
