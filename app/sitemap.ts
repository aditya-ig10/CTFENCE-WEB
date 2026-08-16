import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-08-16");
  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1, lastModified },
    { url: `${siteUrl}/downloads`, changeFrequency: "weekly", priority: 0.9, lastModified },
    { url: `${siteUrl}/evidence`, changeFrequency: "weekly", priority: 0.8, lastModified },
    { url: `${siteUrl}/docs`, changeFrequency: "monthly", priority: 0.7, lastModified },
    { url: `${siteUrl}/team`, changeFrequency: "monthly", priority: 0.6, lastModified },
    { url: `${siteUrl}/blog`, changeFrequency: "monthly", priority: 0.5, lastModified },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.3, lastModified },
    { url: `${siteUrl}/terms`, changeFrequency: "yearly", priority: 0.3, lastModified },
    { url: `${siteUrl}/thank-you`, changeFrequency: "yearly", priority: 0.1, lastModified },
  ];
}
