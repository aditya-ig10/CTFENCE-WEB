import type { Metadata } from "next";
import { Suspense } from "react";
import { JetBrains_Mono, Space_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Breadcrumbs from "@/components/Breadcrumbs";
import Footer from "@/components/Footer";
import GaTag from "@/components/GaTag";
import SmoothScroll from "@/components/SmoothScroll";
import CookieToast from "@/components/CookieToast";
import { organizationSchema, siteUrl } from "@/lib/seo";
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
  title: { default: `${site.name} — ${site.productLine}`, template: `%s — ${site.name}` },
  description:
    "A local MCP policy proxy for AI coding agents. Schema-based checks under 10ms, secret stripping, zero cloud routing.",
};

const themeBoot = `(function(){try{var t=localStorage.getItem('cf-theme');if(!t){t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.setAttribute('data-theme',t)}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body className={`${jetbrains.variable} ${spaceMono.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema()) }}
        />
        <Navbar />
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