import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/docs`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/thank-you`, changeFrequency: "yearly", priority: 0.1 },
  ];
}