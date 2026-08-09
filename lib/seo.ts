import { site } from "@/content/copy";
import type { Metadata } from "next";

export const siteUrl = `https://${site.domain}`;

export function routeUrl(path: string) {
  return `${siteUrl}${path}`;
}

export function baseMetadata({
  title,
  description,
  path,
  image = "/og/home.png",
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
}): Metadata {
  const url = routeUrl(path);
  const ogImage = routeUrl(image);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: site.name,
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: `${site.name} — ${site.productLine}` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: siteUrl,
    slogan: site.productLine,
    address: {
      "@type": "PostalAddress",
      addressLocality: "New Delhi",
      addressCountry: "IN",
      addressRegion: "Delhi",
    },
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