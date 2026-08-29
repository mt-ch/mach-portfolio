"use client";

import { useEffect, type RefObject } from "react";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";

// Set on <html> while a page transition covers the viewport (owned by
// `PageTransitionProvider`); the cursor hides so it never floats alone on the
// blank overlay panel. A plain DOM flag keeps this generic cursor free of
// transition-domain imports.
const PAGE_COVERED_ATTR = "data-page-covered";

// The custom cursor only makes sense for a fine, hover-capable pointer. The
// query is re-evaluated on `change` so plugging in a mouse on a touch device
// activates the cursor without a reload (and unplugging deactivates it).
const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";
const ACTIVE_CLASS = "custom-cursor-active";

type CursorRefs = {
  cursorRef: RefObject<HTMLDivElement | null>;
  cursorBodyRef: RefObject<HTMLDivElement | null>;
};

/**
 * Pointer tracking for the cursor: follows the pointer with a `quickTo`
 * setter (no per-frame `gsap.set`), gives a small press response on
 * mouse down / up, and shows / hides as the pointer enters and leaves the
 * viewport or a page transition covers it.
 *
 * Also owns the `custom-cursor-active` class on `<html>` (which hides the
 * native cursor via CSS), tracking the current input device.
 */
export function useCursorPosition({ cursorRef, cursorBodyRef }: CursorRefs) {
  useEffect(() => {
    const mql = window.matchMedia(FINE_POINTER_QUERY);
    const root = document.documentElement;
    const apply = () => root.classList.toggle(ACTIVE_CLASS, mql.matches);

    apply();
    mql.addEventListener("change", apply);
    return () => {
      mql.removeEventListener("change", apply);
      root.classList.remove(ACTIVE_CLASS);
    };
  }, []);

  useGSAP(
    () => {
      const cursor = cursorRef.current;
      const cursorBody = cursorBodyRef.current;
      if (!cursor || !cursorBody) return;

      const xTo = gsap.quickTo(cursor, "x", { duration: 0.15, ease: "power3.out" });
      const yTo = gsap.quickTo(cursor, "y", { duration: 0.15, ease: "power3.out" });

      let isVisible = false;
      let isCovered = document.documentElement.hasAttribute(PAGE_COVERED_ATTR);

      const applyOpacity = () => {
        gsap.to(cursor, {
          opacity: isCovered || !isVisible ? 0 : 1,
          duration: 0.18,
          ease: "power2.out",
          overwrite: "auto",
        });
      };

      const showCursor = () => {
        if (isVisible) return;
        isVisible = true;
        applyOpacity();
      };

      const hideCursor = () => {
        if (!isVisible) return;
        isVisible = false;
        applyOpacity();
      };

      const coveredObserver = new MutationObserver(() => {
        const next = document.documentElement.hasAttribute(PAGE_COVERED_ATTR);
        if (next === isCovered) return;
        isCovered = next;
        applyOpacity();
      });
      coveredObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: [PAGE_COVERED_ATTR],
      });

      const handleMouseMove = (event: MouseEvent) => {
        xTo(event.clientX);
        yTo(event.clientY);
        showCursor();
      };

      const handleMouseDown = () => {
        gsap.to(cursorBody, { scale: 0.82, duration: 0.1, ease: "power3.out", overwrite: "auto" });
      };

      const handleMouseUp = () => {
        gsap.to(cursorBody, { scale: 1, duration: 0.28, ease: "power4.out", overwrite: "auto" });
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mousedown", handleMouseDown);
      window.addEventListener("mouseup", handleMouseUp);
      document.documentElement.addEventListener("mouseleave", hideCursor);
      document.documentElement.addEventListener("mouseenter", showCursor);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mousedown", handleMouseDown);
        window.removeEventListener("mouseup", handleMouseUp);
        document.documentElement.removeEventListener("mouseleave", hideCursor);
        document.documentElement.removeEventListener("mouseenter", showCursor);
        coveredObserver.disconnect();
      };
    },
    { scope: cursorRef },
  );
}
