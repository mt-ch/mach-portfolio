"use client";

import { useReducedMotion } from "motion/react";

import type { Transition, Variants } from "motion/react";

const FALLBACK_MS = {
  fast: 150,
  base: 220,
  slow: 300,
  error: 200,
} as const;

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

function parseDurationMs(raw: string, fallback: number): number {
  const match = /^([\d.]+)(ms|s)?$/.exec(raw.trim());
  if (!match) return fallback;
  const value = Number.parseFloat(match[1]);
  if (!Number.isFinite(value)) return fallback;
  return match[2] === "s" ? value * 1000 : value;
}

function readCssDurationMs(token: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  const raw = window.getComputedStyle(document.documentElement).getPropertyValue(token);
  return parseDurationMs(raw, fallback);
}

export function motionDurationMs(token: "--duration-base" | "--duration-fast" | "--duration-slow"): number {
  const fallbacks = {
    "--duration-base": FALLBACK_MS.base,
    "--duration-fast": FALLBACK_MS.fast,
    "--duration-slow": FALLBACK_MS.slow,
  } as const;
  return readCssDurationMs(token, fallbacks[token]);
}

export type MessageMotionVariant = "entrance" | "crossfade" | "flat" | "none";

export function useMessageMotion() {
  const reduced = useReducedMotion() ?? false;
  const durationBase = motionDurationMs("--duration-base");
  const durationFast = motionDurationMs("--duration-fast");

  const activeBase = reduced ? durationFast : durationBase;
  const activeError = reduced ? durationFast : FALLBACK_MS.error;
  const translateY = reduced ? 0 : 8;

  const easeOut = EASE_OUT;

  const entranceTransition: Transition = {
    duration: activeBase / 1000,
    ease: easeOut,
  };

  const crossfadeTransition: Transition = {
    duration: durationFast / 1000,
    ease: easeOut,
  };

  const flatTransition: Transition = {
    duration: activeError / 1000,
    ease: easeOut,
  };

  const entranceVariants: Variants = {
    hidden: { opacity: 0, y: translateY },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: reduced ? 0 : 4 },
  };

  const flatVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  function variantFor(kind: MessageMotionVariant): {
    variants: Variants;
    transition: Transition;
    initial: false | "hidden";
  } {
    if (kind === "none") {
      return { variants: flatVariants, transition: crossfadeTransition, initial: false };
    }
    if (kind === "flat" || kind === "crossfade") {
      return { variants: flatVariants, transition: kind === "flat" ? flatTransition : crossfadeTransition, initial: "hidden" };
    }
    return { variants: entranceVariants, transition: entranceTransition, initial: "hidden" };
  }

  return {
    reduced,
    durationFast,
    variantFor,
    citationTransition: crossfadeTransition,
  };
}
