"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { usePathname } from "next/navigation";

import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { getScrollContainer } from "@/components/features/transition/PageTransitionProvider";
import { SMOOTH_SCROLL_LERP } from "@/lib/motion/constants";
import { useMotionEnvironment } from "@/lib/motion/environment";
import { resolveSmoothScroll } from "@/lib/motion/resolveSmoothScroll";

gsap.registerPlugin(ScrollTrigger);

// The live Lenis instance, exposed so the route scroll-reset
// (`RouteScrollReset`) can drive the smoothed position directly rather than
// setting `scrollTop` behind Lenis's back — a raw `scrollTo` mid-momentum
// gets overwritten on Lenis's next frame. `null` whenever smooth scroll is
// off (reduce-motion) or before the provider has mounted.
let activeLenis: Lenis | null = null;

export function getSmoothScroll(): Lenis | null {
  return activeLenis;
}

/**
 * Site-wide smooth scrolling. Mounted once in the `(site)` layout — above the
 * route, so it never remounts on navigation. Binds a core `Lenis` instance
 * (not `ReactLenis`, which would remount page content when toggled) to the
 * nested `[data-scroll-container]` element that `ChatShell` owns, because
 * `<body>` is `overflow-hidden` and the real scroller is nested.
 *
 * Under OS "reduce motion" (`resolveSmoothScroll` → `false`) no instance is
 * created and scrolling is fully native. Touch input stays native regardless
 * — Lenis does not smooth touch.
 *
 * The instance drives the GSAP ticker and calls `ScrollTrigger.update` on
 * every scroll, so scroll-reveal work built on `ScrollTrigger` stays in sync
 * with the smoothed position. `ScrollTrigger.refresh()` runs after each route
 * commit, once the new page's layout is in place.
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const { prefersReducedMotion } = useMotionEnvironment();
  const enabled = resolveSmoothScroll({ prefersReducedMotion });

  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const wrapper = getScrollContainer();
    if (!wrapper) return;

    // wrapper === content puts Lenis in element-native-scroll mode: it eases
    // the container's own `scrollTop` rather than transforming a child, so
    // `scrollTo` on the element and the transition's content-rise tween keep
    // working.
    const lenis = new Lenis({
      wrapper,
      content: wrapper,
      lerp: SMOOTH_SCROLL_LERP,
    });
    lenisRef.current = lenis;
    activeLenis = lenis;

    const update = () => ScrollTrigger.update();
    lenis.on("scroll", update);

    // GSAP's ticker gives seconds; Lenis's `raf` wants milliseconds.
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    // Lag smoothing would let the ticker clamp a long frame delta and stall
    // Lenis mid-scroll; off while Lenis drives the ticker, restored to the
    // GSAP defaults on teardown so other GSAP timelines (the transition
    // panel) keep their normal behaviour.
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.off("scroll", update);
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      lenisRef.current = null;
      activeLenis = null;
    };
  }, [enabled]);

  // Back/forward navigations preserve the scroll position — PageTransition-
  // Provider deliberately does not reset the container on popstate — so the
  // smoothed position must not be snapped to the top for them either.
  const popstateRef = useRef(false);
  useEffect(() => {
    const onPopState = () => {
      popstateRef.current = true;
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // After a client navigation: re-measure, reconcile the smoothed position
  // with the container, and let ScrollTrigger re-measure against the new
  // layout. On a forward nav `RouteScrollReset` already drove Lenis to the
  // top (before the View Transition snapshot); here we only need to catch
  // the back/forward case, syncing Lenis to wherever the browser restored
  // the container's scroll.
  useEffect(() => {
    const lenis = lenisRef.current;
    if (lenis) {
      lenis.resize();
      if (popstateRef.current) {
        lenis.scrollTo(getScrollContainer()?.scrollTop ?? 0, { immediate: true, force: true });
      }
    }
    popstateRef.current = false;
    ScrollTrigger.refresh();
  }, [pathname]);

  return <>{children}</>;
}
