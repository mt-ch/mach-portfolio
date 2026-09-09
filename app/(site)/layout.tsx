import { ViewTransitions } from "next-view-transitions";

import CustomCursor from "@/components/ui/cursor/CustomCursor";

import { ChatShell } from "@/components/features/chat/ChatShell";
import { SmoothScrollProvider } from "@/components/features/motion/SmoothScrollProvider";
import { PageTransitionProvider } from "@/components/features/transition/PageTransitionProvider";
import { RouteScrollReset } from "@/components/features/transition/RouteScrollReset";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ViewTransitions>
      <PageTransitionProvider>
        <SmoothScrollProvider>
          <RouteScrollReset />
          <ChatShell>{children}</ChatShell>
        </SmoothScrollProvider>
      </PageTransitionProvider>
      <CustomCursor />
    </ViewTransitions>
  );
}
