"use client";

import { useEffect, useLayoutEffect, useRef } from "react";

import { usePathname } from "next/navigation";

import { getScrollContainer } from "./PageTransitionProvider";

// Next's document-level scroll restoration does not reach the nested
// `[data-scroll-container]` that `ChatShell` owns (the real scroller, since
// `<body>` is `overflow-hidden`). On a forward navigation that container
// must be snapped to the top *before* the View Transitions API takes its
// snapshot of the new page — otherwise the "old" snapshot keeps the
// outgoing scroll offset and the push visibly jumps (the primary risk
// called out in docs/adr/0014-motion-system.md).
//
// This component lives in the `(site)` layout, above the route, so its
// `useLayoutEffect` runs as part of the same React commit that renders the
// new route — inside `next-view-transitions`' transition, before the new
// snapshot resolves. `popstate` is skipped so the browser's own scroll
// restoration stands, matching ADR 0008's back/forward behaviour.
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
    getScrollContainer()?.scrollTo({ top: 0 });
  }, [pathname]);

  return null;
}
