import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";

import type { Metadata, Viewport } from "next";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { ThemeProvider } from "@/components/features/theme/ThemeProvider";
import { getAbout } from "@/lib/sanity";
import { urlFor } from "@/lib/sanity/image";
import { SITE_URL } from "@/lib/seo/siteUrl";
import {
  DARK_CLASS,
  PREFERS_DARK_QUERY,
  THEME_STORAGE_KEY,
} from "@/lib/theme/constants";
import "./globals.scss";

const openSauceOne = localFont({
  variable: "--font-open-sauce-one",
  src: [
    {
      path: "./fonts/OpenSauceOne-Regular.woff2",
      style: "normal",
      weight: "400",
    },
    {
      path: "./fonts/OpenSauceOne-Italic.woff2",
      style: "italic",
      weight: "400",
    },
    {
      path: "./fonts/OpenSauceOne-Medium.woff2",
      style: "normal",
      weight: "500",
    },
    {
      path: "./fonts/OpenSauceOne-MediumItalic.woff2",
      style: "italic",
      weight: "500",
    },
    {
      path: "./fonts/OpenSauceOne-SemiBold.woff2",
      style: "normal",
      weight: "600",
    },
    {
      path: "./fonts/OpenSauceOne-SemiBoldItalic.woff2",
      style: "italic",
      weight: "600",
    },
    { path: "./fonts/OpenSauceOne-Bold.woff2", style: "normal", weight: "700" },
    {
      path: "./fonts/OpenSauceOne-BoldItalic.woff2",
      style: "italic",
      weight: "700",
    },
  ],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DEFAULT_SITE_NAME = "Matt Chan";
const DEFAULT_TITLE_TEMPLATE = "%s | Matt Chan";
const DEFAULT_META_DESCRIPTION = "Portfolio site";

const iconsMetadata: Metadata["icons"] = {
  icon: [
    { url: "/favicon.ico", sizes: "any" },
    { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
  ],
  apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
};

export async function generateMetadata(): Promise<Metadata> {
  const about = await getAbout();

  const siteName = about?.siteName?.trim() || DEFAULT_SITE_NAME;
  const titleTemplate = about?.titleTemplate?.trim() || DEFAULT_TITLE_TEMPLATE;
  const description =
    about?.defaultMetaDescription?.trim() || DEFAULT_META_DESCRIPTION;

  const ogImageUrl = about?.defaultOgImage
    ? urlFor(about.defaultOgImage).width(1200).height(630).fit("crop").url()
    : undefined;
  const ogImages = ogImageUrl
    ? [{ url: ogImageUrl, width: 1200, height: 630 }]
    : undefined;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: siteName,
      template: titleTemplate,
    },
    description,
    manifest: "/site.webmanifest",
    icons: iconsMetadata,
    openGraph: {
      siteName,
      type: "website",
      title: siteName,
      description,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title: siteName,
      description,
      images: ogImages,
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcfaf8" },
    { media: "(prefers-color-scheme: dark)", color: "#18181b" },
  ],
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
    <html
      lang="en"
      className={`${openSauceOne.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="h-full overflow-hidden">
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
