import type { DrawerMode } from "./useDrawerVisibility";

// Shared by every button in ChatShell's fixed top-right cluster
// (ChatDrawerToggle, ThemeToggle) so they hide/shift in lockstep — a single
// source of truth instead of each button re-deriving the same condition.
export function isHiddenInOverlay(mode: DrawerMode, isMounted: boolean) {
  return mode === "overlay" && isMounted;
}

export const clusterTransitionClassName =
  "transition-transform duration-[var(--duration-slow)] ease-out motion-reduce:transition-opacity motion-reduce:duration-[var(--duration-fast)] motion-reduce:translate-x-0";

export function pushTranslateClassName(mode: DrawerMode, isOpen: boolean) {
  return mode === "push" && isOpen ? "-translate-x-102" : "translate-x-0";
}
