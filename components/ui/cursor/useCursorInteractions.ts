"use client";

import { useEffect, useState } from "react";

import { BASE_VARIANT, cursorVariants, type CursorVariant } from "./cursorVariants";

const INTERACTIVE_SELECTOR = "[data-cursor-text], [data-cursor='link'], [data-cursor='button']";

// Hover detection for the custom cursor: watches the interactive elements
// on the page and reports which `CursorVariant` the pointer is currently
// over (`base` when it is over nothing special). The variant decision
// itself lives in the pure `cursorVariants` seam; this hook only owns the
// DOM wiring and its boundary.
//
// The binding strategy here (a mount-time scan) and any stuck-state reset
// are the sibling bug-fix issue's job (#129); this unit fixes only the
// location and interface.
export function useCursorInteractions(): CursorVariant {
  const [variant, setVariant] = useState<CursorVariant>(BASE_VARIANT);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(INTERACTIVE_SELECTOR));

    const handleEnter = (event: Event) => {
      setVariant(cursorVariants(event.currentTarget as HTMLElement));
    };

    const handleLeave = () => {
      setVariant(BASE_VARIANT);
    };

    elements.forEach((element) => {
      element.addEventListener("mouseenter", handleEnter);
      element.addEventListener("mouseleave", handleLeave);
    });

    return () => {
      elements.forEach((element) => {
        element.removeEventListener("mouseenter", handleEnter);
        element.removeEventListener("mouseleave", handleLeave);
      });
      setVariant(BASE_VARIANT);
    };
  }, []);

  return variant;
}
