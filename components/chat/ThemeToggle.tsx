"use client";

import { MoonIcon, SunIcon } from "lucide-react";

import { isHiddenInOverlay, pushTranslateClassName } from "./toggleClusterAnimation";
import type { DrawerMode } from "./useDrawerVisibility";
import type { Theme } from "./useTheme";

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
  mode: DrawerMode;
  isOpen: boolean;
  isMounted: boolean;
}

export function ThemeToggle({ theme, onToggle, mode, isOpen, isMounted }: ThemeToggleProps) {
  // Mirrors ChatDrawerToggle: steps aside in overlay mode once the drawer
  // has mounted, since it shares the same fixed-position cluster and there's
  // no room to shift sideways on a narrow viewport.
  if (isHiddenInOverlay(mode, isMounted)) return null;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={`inline-flex items-center justify-center rounded-full bg-[#00c9b1] size-10 mix-blend-difference transition-transform duration-300 ease-out ${pushTranslateClassName(mode, isOpen)}`}
    >
      {theme === "dark" ? <SunIcon className="size-md text-black" /> : <MoonIcon className="size-md text-black" />}
    </button>
  );
}
