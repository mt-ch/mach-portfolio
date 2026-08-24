"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";

const STATUS_LABEL = "Assistant is typing";

// Read once per animation setup rather than every render; a live OS-level
// change is picked up because each variant's effect re-subscribes.
function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

export function PulseLoadingIndicator() {
  const dotRef = useRef<HTMLSpanElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = dotRef.current;
    if (reduced || !el) return;

    const tween = gsap.fromTo(
      el,
      { scale: 0.6, opacity: 0.5 },
      { scale: 1, opacity: 1, duration: 0.8, ease: "sine.inOut", yoyo: true, repeat: -1 },
    );
    return () => {
      tween.kill();
    };
  }, [reduced]);

  return (
    <div className="flex justify-start" role="status" aria-label={STATUS_LABEL}>
      <span ref={dotRef} className="size-3 rounded-full bg-brand" />
    </div>
  );
}

export function GradientLoadingIndicator() {
  const barRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const el = barRef.current;
    if (reduced || !el) return;

    gsap.set(el, { backgroundPosition: "0% 0%" });
    const tween = gsap.to(el, { backgroundPosition: "200% 0%", duration: 1.4, ease: "none", repeat: -1 });
    return () => {
      tween.kill();
    };
  }, [reduced]);

  return (
    <div className="flex justify-start" role="status" aria-label={STATUS_LABEL}>
      <div
        ref={barRef}
        className="h-2 w-16 rounded-card bg-[linear-gradient(90deg,var(--color-brand),var(--color-accent),var(--color-brand))] bg-[length:200%_100%]"
      />
    </div>
  );
}

export function OrbitLoadingIndicator() {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    if (reduced || !container) return;

    const dots = container.querySelectorAll<HTMLSpanElement>("[data-dot]");
    const tween = gsap.to(dots, {
      scale: 1.6,
      opacity: 1,
      duration: 0.5,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
      stagger: { each: 0.15, repeat: -1, yoyo: true },
    });
    return () => {
      tween.kill();
    };
  }, [reduced]);

  return (
    <div ref={containerRef} className="flex justify-start" role="status" aria-label={STATUS_LABEL}>
      <div className="flex items-center gap-xs">
        {[0, 1, 2].map((i) => (
          <span key={i} data-dot className="size-1.75 rounded-full bg-brand opacity-50" />
        ))}
      </div>
    </div>
  );
}

export const CHAT_LOADING_VARIANTS = {
  pulse: PulseLoadingIndicator,
  gradient: GradientLoadingIndicator,
  orbit: OrbitLoadingIndicator,
} as const;

export type ChatLoadingVariant = keyof typeof CHAT_LOADING_VARIANTS;
