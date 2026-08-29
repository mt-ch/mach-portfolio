"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import { usePathname, useRouter } from "next/navigation";

// GSAP
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import {
  CONTENT_RISE_EASE,
  CONTENT_RISE_PX,
  COVER_DURATION_MS,
  COVER_EASE,
  FIRST_LOAD_FONT_CAP_MS,
  HOLD_DURATION_MS,
  REDUCED_MOTION_FADE_MS,
  SAFETY_TIMEOUT_MS,
  UNCOVER_DURATION_MS,
  UNCOVER_EASE,
} from "@/lib/transition/constants";

import {
  firstLoadTransitionResult,
  transitionPhase,
  type TransitionEvent,
} from "./transitionPhase";

// PageTransitionProvider signals the custom cursor to fade out by setting
// this attribute on <html> (and clearing it to fade the cursor back in).
// A DOM flag rather than a shared import keeps the generic cursor free of
// any page-transition domain knowledge (see CONTEXT.md).
export const PAGE_COVERED_ATTR = "data-page-covered";

// The chat shell's scroll element carries this attribute (set in ChatShell)
// so the provider can reset it to the top on a forward navigation, and
// rise its content on the uncover — Next's document-level scroll
// restoration does not reach this nested container.
export const SCROLL_CONTAINER_ATTR = "data-scroll-container";

function getScrollContainer(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector<HTMLElement>(`[${SCROLL_CONTAINER_ATTR}]`);
}

interface PageTransitionContextValue {
  // Begin the full-motion transition for an internal forward navigation to
  // `href`. Callers (TransitionLink) own the decision of whether a given
  // click qualifies; the provider trusts that and runs the animation.
  startTransition: (href: string) => void;
}

const PageTransitionContext = createContext<PageTransitionContextValue | null>(null);

// Null when rendered outside a provider — TransitionLink treats that as
// "no transition host" and falls through to plain link behaviour, which
// is also what keeps it usable in isolation (tests, Storybook).
export function usePageTransition(): PageTransitionContextValue | null {
  return useContext(PageTransitionContext);
}

const toSeconds = (ms: number) => ms / 1000;

export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const panelRef = useRef<HTMLDivElement | null>(null);
  const pendingHrefRef = useRef<string | null>(null);

  // The reducer returns the next phase alongside the intent flags
  // (shouldResetScroll, shouldFadeCursor) the provider acts on, so the
  // whole result is held in state rather than re-deriving the flags here.
  // Seeded `covered`/`firstload` so the panel is opaque in the server-
  // rendered HTML and the first client render matches it exactly. The
  // first-load effect below lifts it once fonts are ready.
  const [{ state, shouldResetScroll, shouldFadeCursor }, setResult] = useState(firstLoadTransitionResult);

  // Re-evaluated live by gsap.matchMedia below, so a change to the OS
  // reduced-motion setting takes effect on the next navigation with no
  // reload. When true: the panel is an opacity-only fade — no vertical
  // sweep, no content rise, no hold.
  const [reducedMotion, setReducedMotion] = useState(false);

  const dispatch = useCallback((event: TransitionEvent) => {
    setResult((prev) => transitionPhase(prev.state, event));
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: reduce)", () => {
        setReducedMotion(true);
        return () => setReducedMotion(false);
      });
      return () => mm.revert();
    },
    { scope: panelRef },
  );

  // Fade the custom cursor out while the panel covers the page and back
  // in once it has lifted, so it never sits alone on the blank panel.
  useEffect(() => {
    const root = document.documentElement;
    if (shouldFadeCursor) root.setAttribute(PAGE_COVERED_ATTR, "");
    else root.removeAttribute(PAGE_COVERED_ATTR);
    return () => root.removeAttribute(PAGE_COVERED_ATTR);
  }, [shouldFadeCursor]);

  const startTransition = useCallback(
    (href: string) => {
      pendingHrefRef.current = href;
      dispatch({ type: "NAV_REQUESTED" });
    },
    [dispatch],
  );

  // Browser back/forward: `popstate` fires only *after* history has moved,
  // so it can't be intercepted the way a TransitionLink click is. The
  // handler runs synchronously before the browser paints the destination,
  // so we snap the panel opaque here first — imperatively, ahead of the
  // React re-render — then dispatch POPSTATE so the machine runs an
  // uncover-only reveal (no cover phase, no scroll reset). Dispatching
  // unconditionally means the flag can never be left armed, and a popstate
  // that doesn't move the pathname (hash/query-only entries) still lifts
  // cleanly instead of stranding an opaque panel.
  useEffect(() => {
    const onPopState = () => {
      const panel = panelRef.current;
      if (panel) {
        const background = getComputedStyle(document.documentElement)
          .getPropertyValue("--background")
          .trim();
        if (background) panel.style.backgroundColor = background;
        gsap.set(panel, { yPercent: 0, autoAlpha: 1 });
      }
      dispatch({ type: "POPSTATE" });
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [dispatch]);

  // First load: the panel is already covering the page (seeded state +
  // server-rendered opaque). Lift it exactly once, after web fonts have
  // loaded so text does not reflow under the reader, racing that against
  // the first-load font cap so a slow/blocked font never strands the page.
  const firstLoadReleasedRef = useRef(false);
  useEffect(() => {
    if (firstLoadReleasedRef.current) return;
    if (state.phase !== "covered" || state.path !== "firstload") return;

    const release = () => {
      if (firstLoadReleasedRef.current) return;
      firstLoadReleasedRef.current = true;
      dispatch({ type: "ROUTE_COMMITTED" });
    };

    // The cap is re-armed on every run of this effect (e.g. a dev
    // StrictMode double-invoke) so it can never be lost, and a `cancelled`
    // flag stops the fonts.ready callback dispatching after unmount.
    let cancelled = false;
    const cap = window.setTimeout(release, FIRST_LOAD_FONT_CAP_MS);

    const fonts: FontFaceSet | undefined = document.fonts;
    if (fonts) {
      fonts.ready
        .then(() => {
          if (!cancelled) release();
        })
        .catch(() => {
          if (!cancelled) release();
        });
    }

    return () => {
      cancelled = true;
      window.clearTimeout(cap);
    };
  }, [state.phase, state.path, dispatch]);

  // Drives the route change once the panel is fully covering the page, and
  // resets the nested scroll container so the incoming page is revealed
  // from the top.
  useEffect(() => {
    if (state.phase !== "covered" || !shouldResetScroll) return;

    if (pendingHrefRef.current) router.push(pendingHrefRef.current);
    getScrollContainer()?.scrollTo({ top: 0 });
  }, [state.phase, shouldResetScroll, router]);

  // Safety cap: armed for the whole covering + covered stretch (not
  // re-armed as it crosses between the two), so the overlay always
  // progresses to uncover even if a GSAP or pathname callback never fires.
  const isCoverActive = state.phase === "covering" || state.phase === "covered";
  useEffect(() => {
    if (!isCoverActive) return;
    const safety = window.setTimeout(() => dispatch({ type: "SAFETY_TIMEOUT" }), SAFETY_TIMEOUT_MS);
    return () => window.clearTimeout(safety);
  }, [isCoverActive, dispatch]);

  // A second, independent cap over the uncover phase: if the lift's
  // completion callback never fires the machine would otherwise sit in
  // `uncovering` forever, leaving the cursor hidden and every later
  // navigation dead. This forces it back to idle.
  useEffect(() => {
    if (state.phase !== "uncovering") return;
    const safety = window.setTimeout(() => dispatch({ type: "SAFETY_TIMEOUT" }), SAFETY_TIMEOUT_MS);
    return () => window.clearTimeout(safety);
  }, [state.phase, dispatch]);

  // Once the new pathname is committed, hold briefly, then release the
  // panel. Only meaningful while covered — a pathname change at idle (a
  // plain link) is ignored here.
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    const pathnameChanged = pathname !== prevPathnameRef.current;
    prevPathnameRef.current = pathname;

    if (!pathnameChanged || state.phase !== "covered") return;

    const holdMs = reducedMotion ? 0 : HOLD_DURATION_MS;
    const hold = window.setTimeout(() => dispatch({ type: "ROUTE_COMMITTED" }), holdMs);
    return () => window.clearTimeout(hold);
  }, [pathname, state.phase, reducedMotion, dispatch]);

  // Back/forward: the POPSTATE dispatch above snaps the machine straight to
  // `covered` with no pathname change of its own to key off, so hold from
  // there and release into the uncover-only reveal.
  useEffect(() => {
    if (state.phase !== "covered" || state.path !== "popstate") return;

    const holdMs = reducedMotion ? 0 : HOLD_DURATION_MS;
    const hold = window.setTimeout(() => dispatch({ type: "ROUTE_COMMITTED" }), holdMs);
    return () => window.clearTimeout(hold);
  }, [state.phase, state.path, reducedMotion, dispatch]);

  useGSAP(
    () => {
      const panel = panelRef.current;
      if (!panel) return;

      if (state.phase === "covering") {
        const background = getComputedStyle(document.documentElement).getPropertyValue("--background").trim();
        if (background) panel.style.backgroundColor = background;

        if (reducedMotion) {
          // Opacity-only: the panel sits still and fades in.
          gsap.set(panel, { yPercent: 0, autoAlpha: 0 });
          const tween = gsap.to(panel, {
            autoAlpha: 1,
            duration: toSeconds(REDUCED_MOTION_FADE_MS),
            ease: "none",
            onComplete: () => dispatch({ type: "COVER_DONE" }),
          });
          return () => tween.kill();
        }

        gsap.set(panel, { yPercent: -100, autoAlpha: 1 });
        const tween = gsap.to(panel, {
          yPercent: 0,
          duration: toSeconds(COVER_DURATION_MS),
          ease: COVER_EASE,
          onComplete: () => dispatch({ type: "COVER_DONE" }),
        });
        return () => tween.kill();
      }

      // Back/forward: no cover animation ran, so snap the panel opaque and
      // in place over the already-swapped page. The uncover branch then
      // lifts it exactly as it would after a forward nav.
      if (state.phase === "covered" && state.path === "popstate") {
        const background = getComputedStyle(document.documentElement).getPropertyValue("--background").trim();
        if (background) panel.style.backgroundColor = background;
        gsap.set(panel, { yPercent: 0, autoAlpha: 1 });
        return;
      }

      if (state.phase === "uncovering") {
        if (reducedMotion) {
          // Opacity-only fade back out — no panel lift, no content rise.
          gsap.set(panel, { yPercent: 0 });
          const tween = gsap.to(panel, {
            autoAlpha: 0,
            duration: toSeconds(REDUCED_MOTION_FADE_MS),
            ease: "none",
            onComplete: () => dispatch({ type: "UNCOVER_DONE" }),
          });
          return () => tween.kill();
        }

        const container = getScrollContainer();

        const lift = toSeconds(UNCOVER_DURATION_MS);
        const timeline = gsap.timeline({ onComplete: () => dispatch({ type: "UNCOVER_DONE" }) });
        timeline.to(panel, { yPercent: -100, duration: lift, ease: UNCOVER_EASE }, 0);

        if (container) {
          // Starts ~70% through the panel lift so the incoming content is
          // rising into view as the panel clears its last stretch — an
          // overlap on the tail, not a hand-off after it.
          timeline.fromTo(
            container,
            { y: CONTENT_RISE_PX, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: lift * 0.6, ease: CONTENT_RISE_EASE },
            lift * 0.7,
          );
        }

        return () => timeline.kill();
      }

      if (state.phase === "idle") {
        gsap.set(panel, { autoAlpha: 0, yPercent: -100, clearProps: "backgroundColor" });
        const container = getScrollContainer();
        if (container) gsap.set(container, { clearProps: "transform,opacity,visibility" });
      }
    },
    { dependencies: [state.phase, state.path, reducedMotion], scope: panelRef },
  );

  // While the panel is covering or fully covers the page, it must also
  // swallow pointer events so links beneath it cannot be clicked. During
  // the uncover it lifts away and lets clicks through again.
  const capturesPointer = state.phase === "covering" || state.phase === "covered";

  // Until the first-load cover has lifted, the panel renders opaque so it
  // covers the page with no JavaScript (view-source / JS disabled). Its
  // colour comes straight from the `--background` custom property, which
  // resolves before hydration. Once the machine leaves the `firstload`
  // path GSAP owns the panel and the base style returns to hidden.
  const firstLoadCovering = state.path === "firstload";
  const baseStyle = firstLoadCovering
    ? { visibility: "visible" as const, opacity: 1, backgroundColor: "var(--background)" }
    : { visibility: "hidden" as const, opacity: 0 };

  return (
    <PageTransitionContext.Provider value={{ startTransition }}>
      {children}
      <div
        ref={panelRef}
        aria-hidden
        className="fixed inset-0 z-[5] flex items-center justify-center"
        style={{ ...baseStyle, pointerEvents: capturesPointer ? "auto" : "none" }}
      >
        {/* Slot: a centred mark/wordmark can be dropped in here later
            without restructuring the panel (not built here). */}
      </div>
    </PageTransitionContext.Provider>
  );
}
