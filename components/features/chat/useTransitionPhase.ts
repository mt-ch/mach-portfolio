"use client";

import { useEffect, useState } from "react";

// Shared duration for anything animating alongside the chat drawer's
// open/close transition (the panel itself, and the toggle button that
// hides/repositions around it) so they move off one source of truth
// instead of drifting out of sync.
export const TRANSITION_MS = 300;

type Phase = "closed" | "opening" | "open" | "closing";

// Mount immediately on open (so an entrance transition has something to
// animate from), then flip to "open" a frame later to trigger it. On
// close, drop straight to "closing" (which reverses the transition) and
// only report unmounted once the CSS transition has had time to finish,
// so a slide-out is visible instead of the element just vanishing.
export function useTransitionPhase(isOpen: boolean, durationMs: number = TRANSITION_MS) {
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
      const timeout = setTimeout(() => setPhase("closed"), durationMs);
      return () => clearTimeout(timeout);
    }
  }, [phase, durationMs]);

  return { isMounted: phase !== "closed", isVisible: phase === "open" };
}
