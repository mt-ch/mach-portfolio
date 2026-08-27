import type { DrawerMode } from "./useDrawerVisibility";

// Shared by every button in ChatShell's fixed top-right cluster
// (ChatDrawerToggle, ThemeToggle) so they hide/shift in lockstep — a single
// source of truth instead of each button re-deriving the same condition.
export function isHiddenInOverlay(mode: DrawerMode, isMounted: boolean) {
  return mode === "overlay" && isMounted;
}

export function pushTranslateClassName(mode: DrawerMode, isOpen: boolean) {
  return mode === "push" && isOpen ? "-translate-x-102" : "translate-x-0";
}
