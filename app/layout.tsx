import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { JetBrains_Mono, Space_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Breadcrumbs from "@/components/Breadcrumbs";
import Footer from "@/components/Footer";
import GaTag from "@/components/GaTag";
import SmoothScroll from "@/components/SmoothScroll";
import CookieToast from "@/components/CookieToast";
import LoadingOverlay from "@/components/LoadingOverlay";
import { organizationSchema, siteUrl, webSiteSchema } from "@/lib/seo";
import { site } from "@/content/copy";

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${site.name} — ${site.productLine}`,
    template: `%s — ${site.name}`,
  },
  description:
    "Context Fence is a local MCP policy proxy for AI coding agents: schema-based tool call checks under 10ms, secret stripping, append-only audit log, zero cloud routing.",
  applicationName: site.name,
  authors: [{ name: "Synthrun" }],
  creator: "Synthrun",
  publisher: "Synthrun",
  category: "developer-tools",
  keywords: [
    "context fence",
    "MCP policy proxy",
    "AI agent security",
    "LLM tool call guardrails",
    "local AI proxy",
    "block AI agent secrets",
    "MCP security",
    "agent audit log",
    "prompt injection defense",
    "local LLM gateway",
  ],
  formatDetection: { telephone: false },
  icons: {
    icon: [{ url: "/icon.png", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/icon.png", type: "image/png", sizes: "512x512" }],
    shortcut: [{ url: "/icon.png", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: site.name,
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    siteName: site.name,
    locale: "en_IN",
    type: "website",
  },
  other: {
    "geo.region": "IN-DL",
    "geo.placename": "New Delhi, India",
    "geo.position": "28.6139;77.2090",
    ICBM: "28.6139, 77.2090",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#050507" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

const themeBoot = `(function(){try{var t=localStorage.getItem('cf-theme');if(!t){t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.setAttribute('data-theme',t)}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const graph = [organizationSchema(), webSiteSchema()];
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body className={`${jetbrains.variable} ${spaceMono.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }) }}
        />
        <Navbar />
        <LoadingOverlay />
        <Breadcrumbs />
        <SmoothScroll />
        <CookieToast />
        {children}
        <Footer />
        <Suspense fallback={null}>
          <GaTag />
        </Suspense>
      </body>
    </html>
  );
}