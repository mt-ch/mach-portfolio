"use client";

import type { ReactNode } from "react";

import { ChatDrawer } from "./ChatDrawer";
import { ChatDrawerToggle } from "./ChatDrawerToggle";
import { ThemeToggle } from "@/components/features/theme/ThemeToggle";
import { useDrawerVisibility } from "./useDrawerVisibility";
import { useTransitionPhase } from "./useTransitionPhase";

export function ChatShell({ children }: { children: ReactNode }) {
  const { isOpen, mode, close, toggle } = useDrawerVisibility();
  // Computed once here and passed down, rather than let ChatDrawer and
  // ChatDrawerToggle each derive their own copy — they animate off the
  // same open/close timing by construction, not by convention.
  const { isMounted, isVisible } = useTransitionPhase(isOpen);

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="h-full min-w-0 flex-1 overflow-y-auto">{children}</div>
      <div className="fixed top-md right-md z-10 flex items-center gap-sm">
        <ThemeToggle mode={mode} isOpen={isOpen} isMounted={isMounted} />
        <ChatDrawerToggle isOpen={isOpen} mode={mode} isMounted={isMounted} onToggle={toggle} />
      </div>
      <ChatDrawer isOpen={isOpen} mode={mode} isMounted={isMounted} isVisible={isVisible} onClose={close} />
    </div>
  );
}
