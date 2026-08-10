import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { ChatWidgetPrototype } from "@/components/chat-widget-prototype";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Matt Chan",
  description: "Portfolio site",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        {children}
        {process.env.NODE_ENV !== "production" && (
          <Suspense fallback={null}>
            <ChatWidgetPrototype />
          </Suspense>
        )}
      </body>
    </html>
  );
}
