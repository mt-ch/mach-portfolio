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
  HOLD_DURATION_MS,
  REDUCED_MOTION_FADE_MS,
  SAFETY_TIMEOUT_MS,
  UNCOVER_DURATION_MS,
  UNCOVER_EASE,
} from "@/lib/transition/constants";

import {
  initialTransitionResult,
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
  const [{ state, shouldResetScroll, shouldFadeCursor }, setResult] = useState(initialTransitionResult);

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
  // plain link, back/forward) is ignored here.
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    const pathnameChanged = pathname !== prevPathnameRef.current;
    prevPathnameRef.current = pathname;

    if (!pathnameChanged || state.phase !== "covered") return;

    const holdMs = reducedMotion ? 0 : HOLD_DURATION_MS;
    const hold = window.setTimeout(() => dispatch({ type: "ROUTE_COMMITTED" }), holdMs);
    return () => window.clearTimeout(hold);
  }, [pathname, state.phase, reducedMotion, dispatch]);

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
    { dependencies: [state.phase, reducedMotion], scope: panelRef },
  );

  // While the panel is covering or fully covers the page, it must also
  // swallow pointer events so links beneath it cannot be clicked. During
  // the uncover it lifts away and lets clicks through again.
  const capturesPointer = state.phase === "covering" || state.phase === "covered";

  return (
    <PageTransitionContext.Provider value={{ startTransition }}>
      {children}
      <div
        ref={panelRef}
        aria-hidden
        className="fixed inset-0 z-[5]"
        style={{ visibility: "hidden", opacity: 0, pointerEvents: capturesPointer ? "auto" : "none" }}
      />
    </PageTransitionContext.Provider>
  );
}
