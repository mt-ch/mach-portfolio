import CustomCursor from "@/components/ui/CustomCursor";

import { ChatShell } from "@/components/features/chat/ChatShell";

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <ChatShell>{children}</ChatShell>
      <CustomCursor />
    </>
  );
}
