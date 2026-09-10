"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

// GSAP
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import {
  CONTENT_RISE_EASE,
  CONTENT_RISE_PX,
  FIRST_LOAD_FONT_CAP_MS,
  REDUCED_MOTION_FADE_MS,
  SAFETY_TIMEOUT_MS,
  UNCOVER_DURATION_MS,
  UNCOVER_EASE,
} from "@/lib/transition/constants";

import { firstLoadTransitionResult, transitionPhase, type TransitionEvent } from "./transitionPhase";

// PageTransitionProvider signals the custom cursor to fade out by setting
// this attribute on <html> (and clearing it to fade the cursor back in).
// A DOM flag rather than a shared import keeps the generic cursor free of
// any page-transition domain knowledge (see CONTEXT.md).
export const PAGE_COVERED_ATTR = "data-page-covered";

// The chat shell's scroll element carries this attribute (set in ChatShell)
// so other motion code can find the real scroller — `<body>` is
// `overflow-hidden` and the scroll happens in this nested container.
export const SCROLL_CONTAINER_ATTR = "data-scroll-container";

export function getScrollContainer(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector<HTMLElement>(`[${SCROLL_CONTAINER_ATTR}]`);
}

const toSeconds = (ms: number) => ms / 1000;

// Route-to-route navigation is handled by the native View Transitions page
// push (docs/adr/0014-motion-system.md), not this component. All that
// remains here is ADR 0008's first-load opaque panel: server-rendered
// opaque, lifted once after fonts are ready, with a GSAP timeline and a
// reduced-motion opacity-only fallback.
export function PageTransitionProvider({ children }: { children: ReactNode }) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  // The reducer returns the next phase alongside the one intent flag
  // (shouldFadeCursor) the provider acts on. Seeded `covered` so the panel
  // is opaque in the server-rendered HTML and the first client render
  // matches it exactly; the first-load effect below lifts it once fonts are
  // ready.
  const [{ state, shouldFadeCursor }, setResult] = useState(firstLoadTransitionResult);

  // Re-evaluated live by gsap.matchMedia below, so a change to the OS
  // reduced-motion setting takes effect with no reload. When true the panel
  // lifts as an opacity-only fade — no vertical sweep, no content rise.
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

  // Fade the custom cursor out while the panel covers the page and back in
  // once it has lifted, so it never sits alone on the blank panel.
  useEffect(() => {
    const root = document.documentElement;
    if (shouldFadeCursor) root.setAttribute(PAGE_COVERED_ATTR, "");
    else root.removeAttribute(PAGE_COVERED_ATTR);
    return () => root.removeAttribute(PAGE_COVERED_ATTR);
  }, [shouldFadeCursor]);

  // First load: the panel is already covering the page (seeded state +
  // server-rendered opaque). Lift it exactly once, after web fonts have
  // loaded so text does not reflow under the reader, racing that against
  // the first-load font cap so a slow/blocked font never strands the page.
  const firstLoadReleasedRef = useRef(false);
  useEffect(() => {
    if (firstLoadReleasedRef.current) return;
    if (state.phase !== "covered") return;

    const release = () => {
      if (firstLoadReleasedRef.current) return;
      firstLoadReleasedRef.current = true;
      dispatch({ type: "ROUTE_COMMITTED" });
    };

    let cancelled = false;
    const cap = window.setTimeout(release, FIRST_LOAD_FONT_CAP_MS);

    const fonts: FontFaceSet | undefined = document.fonts;
    if (fonts) {
      fonts.ready.then(() => !cancelled && release()).catch(() => !cancelled && release());
    }

    return () => {
      cancelled = true;
      window.clearTimeout(cap);
    };
  }, [state.phase, dispatch]);

  // Safety cap over the whole covered + uncovering stretch so the overlay
  // always progresses back to idle even if a GSAP completion callback never
  // fires.
  useEffect(() => {
    if (state.phase === "idle") return;
    const safety = window.setTimeout(() => dispatch({ type: "SAFETY_TIMEOUT" }), SAFETY_TIMEOUT_MS);
    return () => window.clearTimeout(safety);
  }, [state.phase, dispatch]);

  useGSAP(
    () => {
      const panel = panelRef.current;
      if (!panel) return;

      if (state.phase === "covered") {
        // GSAP takes ownership of the server-opaque panel: hold it in place
        // over the page until the lift runs.
        const background = getComputedStyle(document.documentElement).getPropertyValue("--background").trim();
        if (background) panel.style.backgroundColor = background;
        gsap.set(panel, { yPercent: 0, autoAlpha: 1 });
        return;
      }

      if (state.phase === "uncovering") {
        if (reducedMotion) {
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

  // While the panel covers the page it swallows pointer events so links
  // beneath it cannot be clicked; during the lift it releases them.
  const capturesPointer = state.phase === "covered";

  // The panel renders opaque for the whole first-load span — covered *and*
  // uncovering — so it covers the page with no JavaScript (view-source / JS
  // disabled) and, crucially, so the base style does not clobber GSAP's
  // inline opacity/visibility mid-lift: the full-motion uncover only tweens
  // `yPercent`, so a hidden base style would slide an invisible panel. Its
  // colour comes straight from `--background`, which resolves before
  // hydration. Only once idle does the base style return to hidden.
  const baseStyle =
    state.phase === "idle"
      ? { visibility: "hidden" as const, opacity: 0 }
      : { visibility: "visible" as const, opacity: 1, backgroundColor: "var(--background)" };

  return (
    <>
      {children}
      <div
        ref={panelRef}
        aria-hidden
        className="fixed inset-0 z-[5] flex items-center justify-center"
        style={{ ...baseStyle, pointerEvents: capturesPointer ? "auto" : "none" }}
      />
    </>
  );
}
