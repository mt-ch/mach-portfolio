"use client";

// The single reader of the motion environment. Every motion feature (smooth
// scroll now; scroll reveals and the view-transition page push later) reads
// its "should this animate, and how" inputs from here — none call
// `matchMedia` or feature-detect independently, so the features cannot drift
// in how they detect the environment.
//
// A subscription is exposed so an OS change (most importantly toggling
// "reduce motion") is reflected without a reload: consumers re-render via
// `useMotionEnvironment`, and the effect that a change gates on — e.g. the
// next client navigation — then sees the new value.

import { useSyncExternalStore } from "react";

import { NARROW_VIEWPORT_QUERY, REDUCED_MOTION_QUERY } from "./constants";

export interface MotionEnvironment {
  /** OS "reduce motion" is set. Disables every motion feature. */
  prefersReducedMotion: boolean;
  /** The browser exposes the CSS View Transitions API. */
  supportsViewTransitions: boolean;
  /** Viewport is at or below the 767px motion boundary (see constants). */
  isNarrowViewport: boolean;
}

// Server render and any non-browser environment: report the no-motion,
// wide, unsupported baseline. A stable reference so React's server snapshot
// never trips the "getServerSnapshot should be cached" guard.
const SERVER_ENVIRONMENT: MotionEnvironment = {
  prefersReducedMotion: false,
  supportsViewTransitions: false,
  isNarrowViewport: false,
};

function hasMatchMedia(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function";
}

function readSupportsViewTransitions(): boolean {
  return (
    typeof document !== "undefined" &&
    typeof (document as Document & { startViewTransition?: unknown }).startViewTransition === "function"
  );
}

function compute(): MotionEnvironment {
  if (!hasMatchMedia()) return SERVER_ENVIRONMENT;
  return {
    prefersReducedMotion: window.matchMedia(REDUCED_MOTION_QUERY).matches,
    supportsViewTransitions: readSupportsViewTransitions(),
    isNarrowViewport: window.matchMedia(NARROW_VIEWPORT_QUERY).matches,
  };
}

// Cached so `getSnapshot` returns a stable reference between changes —
// `useSyncExternalStore` bails out of re-rendering only when the reference
// is unchanged. Recomputed once per observed media change.
let snapshot: MotionEnvironment | null = null;

function getSnapshot(): MotionEnvironment {
  if (snapshot === null) snapshot = compute();
  return snapshot;
}

const listeners = new Set<() => void>();
let mediaQueries: MediaQueryList[] = [];

function onMediaChange() {
  const next = compute();
  const prev = getSnapshot();
  if (
    next.prefersReducedMotion === prev.prefersReducedMotion &&
    next.supportsViewTransitions === prev.supportsViewTransitions &&
    next.isNarrowViewport === prev.isNarrowViewport
  ) {
    return;
  }
  snapshot = next;
  for (const listener of listeners) listener();
}

/**
 * Subscribe to motion-environment changes. Returns an unsubscribe function.
 * Media listeners are attached lazily on the first subscriber and removed
 * when the last one leaves.
 */
export function subscribeMotionEnvironment(listener: () => void): () => void {
  if (listeners.size === 0 && hasMatchMedia()) {
    mediaQueries = [
      window.matchMedia(REDUCED_MOTION_QUERY),
      window.matchMedia(NARROW_VIEWPORT_QUERY),
    ];
    for (const mq of mediaQueries) mq.addEventListener("change", onMediaChange);
  }

  listeners.add(listener);

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      for (const mq of mediaQueries) mq.removeEventListener("change", onMediaChange);
      mediaQueries = [];
      // Drop the cache so a later subscriber recomputes from scratch rather
      // than trusting a snapshot taken while nothing was listening.
      snapshot = null;
    }
  };
}

/** Read the current motion environment once, without subscribing. */
export function readMotionEnvironment(): MotionEnvironment {
  return getSnapshot();
}

function getServerSnapshot(): MotionEnvironment {
  return SERVER_ENVIRONMENT;
}

/**
 * The motion environment as React state: components re-render when the OS
 * setting or viewport crosses a boundary.
 */
export function useMotionEnvironment(): MotionEnvironment {
  return useSyncExternalStore(subscribeMotionEnvironment, getSnapshot, getServerSnapshot);
}
