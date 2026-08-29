import CustomCursor from "@/components/ui/cursor/CustomCursor";

import { ChatShell } from "@/components/features/chat/ChatShell";
import { PageTransitionProvider } from "@/components/features/transition/PageTransitionProvider";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <PageTransitionProvider>
        <ChatShell>{children}</ChatShell>
      </PageTransitionProvider>
      <CustomCursor />
    </>
  );
}
