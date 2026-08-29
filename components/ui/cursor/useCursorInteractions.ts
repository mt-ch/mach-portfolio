"use client";

import { useEffect, useState } from "react";

import { usePathname } from "next/navigation";

import { BASE_VARIANT, cursorVariants, type CursorVariant } from "./cursorVariants";

// Set on <html> by `ChatShell` while the chat drawer is open. The cursor lives
// outside the chat subtree, so a plain DOM flag is how it learns the drawer
// opened or closed without importing chat state.
export const CHAT_OPEN_ATTR = "data-chat-open";

const CURSOR_SELECTOR = "[data-cursor]";

function taggedAncestor(target: EventTarget | null): HTMLElement | null {
  return target instanceof Element ? target.closest<HTMLElement>(CURSOR_SELECTOR) : null;
}

/**
 * Delegated cursor-variant tracking. One pair of document-level listeners
 * (`mouseover` / `mouseout`, which bubble — `mouseenter` / `mouseleave` do
 * not) resolves the nearest `[data-cursor]` ancestor of whatever the pointer
 * is over. This is correct for elements that mount after this hook (the chat
 * drawer, the next page after a client-side navigation, the 404 page) with no
 * re-scan.
 *
 * The variant is reset to base on `mouseout` to untagged space, on a committed
 * route change (`usePathname`), and on the chat drawer opening or closing —
 * the three ways a hovered element can vanish without a `mouseleave`.
 */
export function useCursorInteractions(): CursorVariant {
  const pathname = usePathname();
  const [variant, setVariant] = useState<CursorVariant>(BASE_VARIANT);

  // Route committed: the previous page's hovered element is gone. Adjusting
  // state during render (rather than in an effect) is React's recommended
  // pattern for reacting to a changed value and avoids a cascading render.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    if (variant.kind !== "base") setVariant(BASE_VARIANT);
  }

  useEffect(() => {
    const handleOver = (event: MouseEvent) => {
      const tagged = taggedAncestor(event.target);
      if (!tagged) return;
      // Moving between two children of the same tagged element must not
      // re-fire the variant.
      if (event.relatedTarget instanceof Node && tagged.contains(event.relatedTarget)) return;
      setVariant(cursorVariants(tagged));
    };

    const handleOut = (event: MouseEvent) => {
      const tagged = taggedAncestor(event.target);
      if (!tagged) return;
      if (event.relatedTarget instanceof Node && tagged.contains(event.relatedTarget)) return;
      setVariant(BASE_VARIANT);
    };

    document.addEventListener("mouseover", handleOver);
    document.addEventListener("mouseout", handleOut);

    return () => {
      document.removeEventListener("mouseover", handleOver);
      document.removeEventListener("mouseout", handleOut);
    };
  }, []);

  // Chat drawer opened or closed: a hovered drawer button may have unmounted.
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => setVariant(BASE_VARIANT));
    observer.observe(root, { attributes: true, attributeFilter: [CHAT_OPEN_ATTR] });
    return () => observer.disconnect();
  }, []);

  return variant;
}
