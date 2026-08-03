import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
