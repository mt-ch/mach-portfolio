"use client";

import type { RefObject } from "react";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";

// Set on <html> while a page transition covers the viewport; the cursor
// hides itself so it never floats alone on the blank overlay panel. A
// plain DOM flag keeps this generic cursor free of transition-domain
// imports.
const PAGE_COVERED_ATTR = "data-page-covered";

// Pointer tracking for the custom cursor: follows the pointer on
// `mousemove`, gives a small press response on `mousedown` / `mouseup`,
// and shows / hides the cursor as the pointer enters and leaves the
// viewport (staying hidden while a page transition covers the screen).
// Animation-bound presentational glue — verified manually, not unit
// tested.
export function useCursorPosition(
  cursorRef: RefObject<HTMLDivElement | null>,
  cursorBodyRef: RefObject<HTMLDivElement | null>,
) {
  useGSAP(
    () => {
      const cursor = cursorRef.current;
      const cursorBody = cursorBodyRef.current;

      if (!cursor || !cursorBody) return;

      let isVisible = false;
      // True while a page transition covers the screen: the cursor stays
      // hidden regardless of pointer movement so it never floats alone on
      // the opaque panel.
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
        const nextCovered = document.documentElement.hasAttribute(PAGE_COVERED_ATTR);
        if (nextCovered === isCovered) return;
        isCovered = nextCovered;
        applyOpacity();
      });
      coveredObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: [PAGE_COVERED_ATTR],
      });

      const handleMouseMove = (e: MouseEvent) => {
        gsap.set(cursor, {
          x: e.clientX,
          y: e.clientY,
        });

        showCursor();
      };

      const handleMouseDown = () => {
        gsap.to(cursorBody, {
          scale: 0.82,
          duration: 0.1,
          ease: "power3.out",
          overwrite: "auto",
        });
      };

      const handleMouseUp = () => {
        gsap.to(cursorBody, {
          scale: 1,
          duration: 0.28,
          ease: "power4.out",
          overwrite: "auto",
        });
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
        coveredObserver.disconnect();

        document.documentElement.removeEventListener("mouseleave", hideCursor);
        document.documentElement.removeEventListener("mouseenter", showCursor);
      };
    },
    { scope: cursorRef },
  );
}
