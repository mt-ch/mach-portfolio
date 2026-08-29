"use client";

import { motionDurationMs } from "./messageMotion";

// Single source of truth for the drawer's shell timing: the same
// `--duration-slow` motion token the CSS transitions animate over, read at
// runtime so the JS unmount delay and the CSS transition can never drift
// apart. Falls back to the token's own declared value when there is no
// computed style to read (SSR, jsdom).
export function drawerTransitionMs(): number {
  return motionDurationMs("--duration-slow");
}
