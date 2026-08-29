"use client";

import { useEffect, type ReactNode } from "react";

import { CHAT_OPEN_ATTR } from "@/components/ui/cursor/useCursorInteractions";

import { ChatDrawer } from "./ChatDrawer";
import { ChatDrawerToggle } from "./ChatDrawerToggle";
import { ThemeToggle } from "@/components/features/theme/ThemeToggle";
import { SCROLL_CONTAINER_ATTR } from "@/components/features/transition/PageTransitionProvider";
import { useDrawerVisibility } from "./useDrawerVisibility";
import { useTransitionPhase } from "./useTransitionPhase";

export function ChatShell({ children }: { children: ReactNode }) {
  const { isOpen, mode, close, toggle } = useDrawerVisibility();
  // Computed once here and passed down, rather than let ChatDrawer and
  // ChatDrawerToggle each derive their own copy — they animate off the
  // same open/close timing by construction, not by convention.
  const { isMounted, isVisible } = useTransitionPhase(isOpen);

  // Expose drawer open/closed to the custom cursor, which lives outside this
  // subtree and resets its variant when the drawer's late-mounted buttons
  // appear or vanish.
  useEffect(() => {
    const root = document.documentElement;
    if (isOpen) root.setAttribute(CHAT_OPEN_ATTR, "");
    else root.removeAttribute(CHAT_OPEN_ATTR);
    return () => root.removeAttribute(CHAT_OPEN_ATTR);
  }, [isOpen]);

  return (
    <div className="flex h-full w-full overflow-hidden">
      <div className="h-full min-w-0 flex-1 overflow-y-auto" {...{ [SCROLL_CONTAINER_ATTR]: "" }}>
        {children}
      </div>
      <div className="fixed top-md right-md z-10 flex items-center gap-sm">
        <ThemeToggle mode={mode} isOpen={isOpen} isMounted={isMounted} />
        <ChatDrawerToggle isOpen={isOpen} mode={mode} isMounted={isMounted} onToggle={toggle} />
      </div>
      <ChatDrawer isOpen={isOpen} mode={mode} isMounted={isMounted} isVisible={isVisible} onClose={close} />
    </div>
  );
}
