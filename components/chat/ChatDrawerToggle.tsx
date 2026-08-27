"use client";

import { XIcon } from "lucide-react";

import { isHiddenInOverlay, pushTranslateClassName } from "./toggleClusterAnimation";
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
  if (isHiddenInOverlay(mode, isMounted)) return null;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-label="Open chat"
      className={`inline-flex items-center justify-center gap-sm h-10 px-sm transition-transform duration-300 ease-out cursor-pointer ${
        mode === "push" && isOpen
          ? "-translate-x-102 w-10 bg-grey-200 text-grey-700 dark:bg-grey-700 dark:text-grey-200"
          : "translate-x-0 bg-brand text-white"
      }`}
      data-cursor="button"
    >
      <span className="type-small font-medium">{isOpen ? <XIcon className="size-md" strokeWidth={1.75} /> : "Ask"}</span>
    </button>
  );
}
