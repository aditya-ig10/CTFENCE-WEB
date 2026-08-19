import { site } from "@/content/copy";
import type { Metadata } from "next";

export const siteUrl = `https://${site.domain}`;

export function routeUrl(path: string) {
  return `${siteUrl}${path}`;
}

const SITE_KEYWORDS = [
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
];

export function baseMetadata({
  title,
  description,
  path,
  image = "/og/home.png",
  keywords = SITE_KEYWORDS,
  type = "website",
  publishedTime,
  modifiedTime,
  robots,
  ogTitle,
  ogDescription,
  twitterTitle,
  twitterDescription,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  keywords?: string[];
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  robots?: Metadata["robots"];
  ogTitle?: string;
  ogDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
}): Metadata {
  const url = routeUrl(path);
  const ogImage = routeUrl(image);
  const resolvedOgTitle = ogTitle ?? (title.length < 25 ? `${title} · ${site.name}` : title);
  const resolvedOgDescription = ogDescription ?? description;
  const resolvedTwitterTitle = twitterTitle ?? title;
  const resolvedTwitterDescription = twitterDescription ?? description;
  return {
    title,
    description,
    keywords,
    authors: [{ name: "Synthrun", url: siteUrl }],
    creator: "Synthrun",
    publisher: "Synthrun",
    alternates: { canonical: url, languages: { en: url, "x-default": url } },
    robots: robots ?? {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    openGraph: {
      title: resolvedOgTitle,
      description: resolvedOgDescription,
      url,
      siteName: site.name,
      locale: "en_IN",
      type,
      ...(publishedTime ? { publishedTime } : {}),
      ...(modifiedTime ? { modifiedTime } : {}),
      images: [
        { url: ogImage, width: 1200, height: 630, alt: `${site.name} — ${site.productLine}` },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@contextfence",
      creator: "@contextfence",
      title: resolvedTwitterTitle,
      description: resolvedTwitterDescription,
      images: [ogImage],
    },
  };
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: site.name,
    url: siteUrl,
    slogan: site.productLine,
    description:
      "Context Fence is a local policy proxy for AI coding agents: schema-based MCP tool call checks under 10ms, secret stripping, and an append-only local audit log with zero cloud routing.",
    logo: {
      "@type": "ImageObject",
      url: `${siteUrl}/icon.png`,
      width: 512,
      height: 512,
    },
    image: `${siteUrl}/og/home.png`,
    sameAs: [
      "https://github.com/aditya-ig10/context-fence",
      "https://github.com/aditya-ig10/context-fence-windows",
    ],
    address: {
      "@type": "PostalAddress",
      addressLocality: "New Delhi",
      addressRegion: "Delhi",
      addressCountry: "IN",
    },
    foundingLocation: {
      "@type": "Place",
      name: "New Delhi, India",
    },
  };
}

export function webSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: site.name,
    url: siteUrl,
    description: site.productLine,
    publisher: { "@id": `${siteUrl}/#organization` },
    inLanguage: "en",
  };
}

export function softwareAppSchema({
  name,
  description,
  path,
  keywords,
}: {
  name: string;
  description: string;
  path: string;
  keywords: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${routeUrl(path)}#software`,
    name,
    description,
    url: routeUrl(path),
    applicationCategory: "DeveloperApplication",
    operatingSystem: "macOS, Windows",
    softwareVersion: "1.1.6",
    releaseNotes: `${routeUrl("/downloads")}#release`,
    downloadUrl: routeUrl("/downloads"),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
    },
    featureList: keywords,
    publisher: { "@id": `${siteUrl}/#organization` },
  };
}

export function webPageSchema({
  name,
  description,
  path,
  image = "/og/home.png",
}: {
  name: string;
  description: string;
  path: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${routeUrl(path)}#webpage`,
    name,
    description,
    url: routeUrl(path),
    image: routeUrl(image),
    inLanguage: "en",
    isPartOf: { "@id": `${siteUrl}/#website` },
    about: { "@id": `${siteUrl}/#organization` },
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: routeUrl(it.path),
    })),
  };
}

export function faqSchema(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.q,
      acceptedAnswer: { "@type": "Answer", text: it.a },
    })),
  };
}