"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

import { usePathname } from "next/navigation";

import { getSmoothScroll } from "@/components/features/motion/SmoothScrollProvider";

import { getScrollContainer } from "./PageTransitionProvider";

// Snap the nested `[data-scroll-container]` that `ChatShell` owns (the real
// scroller, since `<body>` is `overflow-hidden`) back to the top on a
// forward navigation. Two things make this necessary and fiddly:
//
//  1. Next's own scroll handling targets the document scroller, and it
//     skips scrolling entirely when a navigation reuses route segments from
//     the client cache (returning to a page visited earlier) — so nothing
//     built-in resets our container.
//  2. Smooth scroll (Lenis) eases `scrollTop` on its own RAF loop. A raw
//     `scrollTo` issued while Lenis still holds the old target gets
//     overwritten on the next frame, which is why the reset intermittently
//     "didn't take" after a few quick navigations.
//
// So: drive Lenis directly when it is running, and re-assert for a couple
// of frames to outlast Lenis momentum and Next's post-navigation
// `focus()` / `scrollIntoView()`. The first pass runs in `useLayoutEffect`
// — the same React commit that renders the new route, inside
// `next-view-transitions`' transition — so the View Transition's new-state
// snapshot is taken with the container already at the top and the push
// does not visibly jump. `popstate` is skipped: the browser's own scroll
// restoration stands for back/forward, matching ADR 0008.
function resetScrollToTop() {
  const lenis = getSmoothScroll();
  if (lenis) {
    lenis.scrollTo(0, { immediate: true, force: true });
    return;
  }
  getScrollContainer()?.scrollTo({ top: 0 });
}

export function RouteScrollReset() {
  const pathname = usePathname();
  const isFirstRun = useRef(true);
  const isPopstate = useRef(false);

  // Kept in sync with the current pathname so the popstate handler (a stable
  // listener) can tell a real back/forward navigation from a hash/query-only
  // history entry.
  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    const onPopState = () => {
      // Only arm the skip flag when the path actually changes — a
      // hash/query-only popstate never triggers the layout effect below, so
      // a flag armed for it would linger and wrongly suppress the reset on
      // the next forward navigation.
      if (window.location.pathname !== pathnameRef.current) {
        isPopstate.current = true;
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useLayoutEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (isPopstate.current) {
      isPopstate.current = false;
      return;
    }

    resetScrollToTop();

    // Re-assert over the next few frames: Lenis can still write a stale
    // eased position, and Next runs its own `focus()` / `scrollIntoView()`
    // right after the navigation commits.
    let frame = 0;
    let raf = 0;
    const reassert = () => {
      resetScrollToTop();
      if (++frame < 3) raf = requestAnimationFrame(reassert);
    };
    raf = requestAnimationFrame(reassert);
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  return null;
}
