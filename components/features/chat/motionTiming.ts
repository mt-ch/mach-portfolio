"use client";

// Single source of truth for the drawer's shell timing: the same
// `--duration-slow` motion token the CSS transitions animate over, read at
// runtime so the JS unmount delay and the CSS transition can never drift
// apart. Falls back to the token's own declared value when there is no
// computed style to read (SSR, jsdom).
const FALLBACK_MS = 300;

export function drawerTransitionMs(): number {
  if (typeof window === "undefined") return FALLBACK_MS;
  const raw = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue("--duration-slow")
    .trim();
  const match = /^([\d.]+)(ms|s)?$/.exec(raw);
  if (!match) return FALLBACK_MS;
  const value = Number.parseFloat(match[1]);
  if (!Number.isFinite(value)) return FALLBACK_MS;
  return match[2] === "s" ? value * 1000 : value;
}
