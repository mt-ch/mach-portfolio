import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";

import type { Metadata } from "next";

import { ThemeProvider } from "@/components/features/theme/ThemeProvider";
import { DARK_CLASS, PREFERS_DARK_QUERY, THEME_STORAGE_KEY } from "@/lib/theme/constants";
import "./globals.scss";

const openSauceOne = localFont({
  variable: "--font-open-sauce-one",
  src: [
    { path: "./fonts/OpenSauceOne-Regular.woff2", style: "normal", weight: "400" },
    { path: "./fonts/OpenSauceOne-Italic.woff2", style: "italic", weight: "400" },
    { path: "./fonts/OpenSauceOne-Medium.woff2", style: "normal", weight: "500" },
    { path: "./fonts/OpenSauceOne-MediumItalic.woff2", style: "italic", weight: "500" },
    { path: "./fonts/OpenSauceOne-SemiBold.woff2", style: "normal", weight: "600" },
    { path: "./fonts/OpenSauceOne-SemiBoldItalic.woff2", style: "italic", weight: "600" },
    { path: "./fonts/OpenSauceOne-Bold.woff2", style: "normal", weight: "700" },
    { path: "./fonts/OpenSauceOne-BoldItalic.woff2", style: "italic", weight: "700" },
  ],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Matt Chan",
  description: "Portfolio site",
};

// Runs before hydration so the correct theme class is on <html> before
// first paint — otherwise the page would flash light before ThemeProvider's
// effect ever runs. Built from the same lib/theme/constants the provider
// consumes, so the resolution order can never drift between the two.
const themeInitScript = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k);if(t!=="light"&&t!=="dark"){t=window.matchMedia(${JSON.stringify(
  PREFERS_DARK_QUERY,
)}).matches?"dark":"light";}if(t==="dark"){document.documentElement.classList.add(${JSON.stringify(DARK_CLASS)});}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${openSauceOne.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="h-full overflow-hidden">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
