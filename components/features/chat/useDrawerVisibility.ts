"use client";

import { useCallback, useEffect, useState } from "react";

// Tailwind's default `sm` breakpoint — reused as-is rather than introducing
// a new breakpoint convention for just this component.
const DESKTOP_QUERY = "(min-width: 640px)";

export type DrawerMode = "push" | "overlay";

export function useDrawerVisibility() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === "undefined" ? true : window.matchMedia(DESKTOP_QUERY).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    const onChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close]);

  const mode: DrawerMode = isDesktop ? "push" : "overlay";

  return { isOpen, mode, open, close, toggle };
}
