import CustomCursor from "@/components/ui/cursor/CustomCursor";

import { ChatShell } from "@/components/features/chat/ChatShell";
import { SmoothScrollProvider } from "@/components/features/motion/SmoothScrollProvider";
import { PageTransitionProvider } from "@/components/features/transition/PageTransitionProvider";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <PageTransitionProvider>
        <SmoothScrollProvider>
          <ChatShell>{children}</ChatShell>
        </SmoothScrollProvider>
      </PageTransitionProvider>
      <CustomCursor />
    </>
  );
}
