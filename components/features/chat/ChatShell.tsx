"use client";

import { useEffect, useState, type ReactNode } from "react";

import { AnimatePresence } from "motion/react";

import { CHAT_OPEN_ATTR } from "@/components/ui/cursor/useCursorInteractions";
import { ThemeToggle } from "@/components/features/theme/ThemeToggle";
import { SCROLL_CONTAINER_ATTR } from "@/components/features/transition/PageTransitionProvider";
import { ASK_ENABLED } from "@/lib/assistant/config";

import { ChatDrawer } from "./ChatDrawer";
import { ChatDrawerToggle } from "./ChatDrawerToggle";
import { useDrawerVisibility } from "./useDrawerVisibility";

function ScrollContainer({ children }: { children: ReactNode }) {
  return (
    <div className="h-full min-w-0 flex-1 overflow-y-auto" {...{ [SCROLL_CONTAINER_ATTR]: "" }}>
      {children}
    </div>
  );
}

export function ChatShell({ children }: { children: ReactNode }) {
  // Ask is paused (see docs/adr/0013). Keep the scroll container and the
  // theme toggle — the other things this shell owns — and mount nothing
  // chat-related: no drawer, no toggle, no drawer-visibility subscription,
  // no chat-open attribute on <html>.
  if (!ASK_ENABLED) {
    return (
      <div className="flex h-full w-full overflow-hidden">
        <ScrollContainer>{children}</ScrollContainer>
        <div className="fixed top-md right-md z-10 flex items-center gap-sm">
          <ThemeToggle mode="push" isOpen={false} isMounted={false} />
        </div>
      </div>
    );
  }

  return <ChatShellWithAsk>{children}</ChatShellWithAsk>;
}

function ChatShellWithAsk({ children }: { children: ReactNode }) {
  const { isOpen, mode, close, toggle } = useDrawerVisibility();
  // The drawer owns its own presence via AnimatePresence; the cluster only
  // needs to know whether the panel is still on screen (including during its
  // exit) so it can stay out of the way in overlay mode until fully gone.
  const [isDrawerMounted, setIsDrawerMounted] = useState(false);
  if (isOpen && !isDrawerMounted) setIsDrawerMounted(true);

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
      <ScrollContainer>{children}</ScrollContainer>
      <div className="fixed top-md right-md z-10 flex items-center gap-sm">
        <ThemeToggle mode={mode} isOpen={isOpen} isMounted={isDrawerMounted} />
        <ChatDrawerToggle isOpen={isOpen} mode={mode} isMounted={isDrawerMounted} onToggle={toggle} />
      </div>
      <AnimatePresence onExitComplete={() => setIsDrawerMounted(false)}>
        {isOpen && <ChatDrawer key="chat-drawer" mode={mode} onClose={close} />}
      </AnimatePresence>
    </div>
  );
}
