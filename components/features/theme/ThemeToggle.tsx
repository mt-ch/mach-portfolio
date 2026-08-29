"use client";

import { MoonIcon, SunIcon } from "lucide-react";

import {
  clusterTransitionClassName,
  isHiddenInOverlay,
  pushTranslateClassName,
} from "@/components/features/chat/toggleClusterAnimation";
import type { DrawerMode } from "@/components/features/chat/useDrawerVisibility";
import { useTheme } from "./ThemeProvider";

interface ThemeToggleProps {
  mode: DrawerMode;
  isOpen: boolean;
  isMounted: boolean;
}

export function ThemeToggle({ mode, isOpen, isMounted }: ThemeToggleProps) {
  const { theme, toggle } = useTheme();

  // Mirrors ChatDrawerToggle: steps aside in overlay mode once the drawer
  // has mounted, since it shares the same fixed-position cluster and there's
  // no room to shift sideways on a narrow viewport.
  if (isHiddenInOverlay(mode, isMounted)) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className={`inline-flex items-center justify-center bg-grey-200 text-grey-700 dark:bg-grey-700 dark:text-grey-200 size-10 ${clusterTransitionClassName} cursor-pointer ${pushTranslateClassName(
        mode,
        isOpen,
      )}`}
      data-cursor="button"
    >
      {theme === "dark" ? <SunIcon className="size-md" strokeWidth={1.75} /> : <MoonIcon className="size-md" strokeWidth={1.75} />}
    </button>
  );
}
