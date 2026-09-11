"use client";

import { useCallback, useEffect, useRef } from "react";

import { useMotionEnvironment } from "./environment";
import { planSectionReveal } from "./revealPlan";

/**
 * The imperative shell for reveal-on-scroll (#226). Attach the returned ref to
 * the element to reveal. On mount it reads the plan from `planSectionReveal`,
 * hides the target(s), and wires an IntersectionObserver that reveals each one
 * as its top passes the threshold and then unobserves it — so a reveal fires
 * once and does not replay on scroll back up and down.
 *
 * `stagger: true` treats the element's direct children as a group and cascades
 * them by the plan's per-child delay; the default reveals the element as one
 * block. Under OS "reduce motion" the plan is disabled: nothing is hidden and
 * all content is simply present.
 */
export function useSectionReveal({
  stagger = false,
}: { stagger?: boolean } = {}) {
  const { prefersReducedMotion } = useMotionEnvironment();
  const nodeRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const container = nodeRef.current;
    if (!container || typeof IntersectionObserver === "undefined") return;

    const targets: HTMLElement[] = stagger
      ? Array.from(container.children).filter(
          (child): child is HTMLElement => child instanceof HTMLElement,
        )
      : [container];

    const plan = planSectionReveal({
      childCount: targets.length,
      env: { prefersReducedMotion },
    });
    if (!plan.enabled || targets.length === 0) return;

    for (const el of targets) {
      el.style.opacity = "0";
      el.style.transform = `translateY(${plan.risePx}px)`;
      el.style.willChange = "opacity, transform";
    }

    const bottomMargin = Math.round((1 - plan.thresholdRatio) * 100);
    const observer = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          const index = Math.max(targets.indexOf(el), 0);
          el.style.transition = `opacity ${plan.durationMs}ms ${plan.ease}, transform ${plan.durationMs}ms ${plan.ease}`;
          el.style.transitionDelay = `${index * plan.staggerMs}ms`;
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
          el.style.willChange = "";
          obs.unobserve(el);
        }
      },
      { rootMargin: `0px 0px -${bottomMargin}% 0px` },
    );

    for (const el of targets) observer.observe(el);

    return () => observer.disconnect();
  }, [prefersReducedMotion, stagger]);

  return useCallback((node: HTMLElement | null) => {
    nodeRef.current = node;
  }, []);
}
