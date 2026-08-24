"use client";

import type { ReactNode } from "react";

import { SmoothScrollProvider } from "@/components/SmoothScrollProvider";

import { ChatDrawer } from "./ChatDrawer";
import { useDrawerVisibility } from "./useDrawerVisibility";

export function ChatShell({ children }: { children: ReactNode }) {
  const { isOpen, mode, close, toggle } = useDrawerVisibility();

  return (
    <div className="flex h-full w-full overflow-hidden">
      <SmoothScrollProvider className="h-full min-w-0 flex-1 overflow-y-auto">
        {children}
      </SmoothScrollProvider>
      <ChatDrawer isOpen={isOpen} mode={mode} onClose={close} onToggle={toggle} />
    </div>
  );
}
