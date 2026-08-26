"use client";

import { DotIcon } from "lucide-react";

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
      className={`inline-flex items-center gap-sm rounded-full bg-[#00c9b1] h-10 px-sm mix-blend-difference transition-transform duration-300 ease-out ${pushTranslateClassName(mode, isOpen)}`}
    >
      <span className="type-small font-medium text-black">
        {isOpen ? (
          <div className="flex items-center gap-2xs">
            <div className="size-1 rounded-full bg-black" />
            <div className="size-1 rounded-full bg-black" />
            <div className="size-1 rounded-full bg-black" />
          </div>
        ) : (
          "Ask"
        )}
      </span>
    </button>
  );
}
