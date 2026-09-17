"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { breadcrumbSchema } from "@/lib/seo";

const LABELS: Record<string, string> = {
  downloads: "Downloads",
  blog: "Blog",
  team: "Team",
  privacy: "Privacy",
  terms: "Terms",
  profile: "Profile",
  checkout: "Checkout",
  dashboard: "Dashboard",
  "thank-you": "Thank you",
};

export default function Breadcrumbs() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  const segs = pathname.split("/").filter(Boolean);
  if (segs.length === 0) return null;
  const items = [{ name: "Home", path: "/" }];
  let acc = "";
  for (const s of segs) {
    acc += `/${s}`;
    items.push({ name: LABELS[s] ?? s, path: acc });
  }
  const jsonLd = breadcrumbSchema(items);
  return (
    <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 2rem" }}>
      <nav
        aria-label="Breadcrumb"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          padding: "1.4rem 0 0.6rem",
          fontFamily: "DM Mono, monospace",
          fontSize: "0.62rem",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--ink4)",
        }}
      >
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <span key={it.path} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
              {i > 0 && <span style={{ color: "var(--rule)", fontSize: "0.7rem" }}>/</span>}
              {last ? (
                <span style={{ color: "var(--ink3)" }}>{it.name}</span>
              ) : (
                <Link href={it.path} style={{ color: "var(--ink4)", textDecoration: "none" }}>{it.name}</Link>
              )}
            </span>
          );
        })}
      </nav>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
