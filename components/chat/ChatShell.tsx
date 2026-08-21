"use client";

import type { ReactNode } from "react";

import { ChatDrawer } from "./ChatDrawer";
import { useDrawerVisibility } from "./useDrawerVisibility";

export function ChatShell({ children }: { children: ReactNode }) {
  const { isOpen, mode, close, toggle } = useDrawerVisibility();

  return (
    <div className="flex h-full min-h-screen w-full">
      <div className="min-w-0 flex-1">{children}</div>
      <ChatDrawer isOpen={isOpen} mode={mode} onClose={close} onToggle={toggle} />
    </div>
  );
}
