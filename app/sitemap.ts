import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/evidence`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/downloads`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/team`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/docs`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/blog`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/thank-you`, changeFrequency: "yearly", priority: 0.1 },
  ];
}
