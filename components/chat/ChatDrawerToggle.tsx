"use client";

import type { DrawerMode } from "./useDrawerVisibility";

interface ChatDrawerToggleProps {
  isOpen: boolean;
  mode: DrawerMode;
  isMounted: boolean;
  onToggle: () => void;
}

export function ChatDrawerToggle({ isOpen, mode, isMounted, onToggle }: ChatDrawerToggleProps) {
  // Overlay mode's drawer already has its own explicit close control, and
  // there's no room to shift the toggle sideways on a narrow viewport, so
  // it steps aside entirely until the drawer has fully closed again.
  if (mode === "overlay" && isMounted) return null;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-label="Open chat"
      className={`fixed top-md right-md z-10 inline-flex items-center gap-sm rounded-full bg-white px-sm py-xs mix-blend-difference transition-transform duration-300 ease-out ${
        mode === "push" && isOpen ? "-translate-x-102" : "translate-x-0"
      }`}
    >
      <span className="type-small font-medium text-black">{isOpen ? "..." : "Ask"}</span>
    </button>
  );
}
