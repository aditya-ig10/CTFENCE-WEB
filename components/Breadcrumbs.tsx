"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { breadcrumbSchema } from "@/lib/seo";

// label lookup for route segments; anything unknown falls back to the raw segment
const LABELS: Record<string, string> = {
  docs: "Docs",
  blog: "Blog",
  privacy: "Privacy",
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
    <div className="container">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        {items.map((it, i) => {
          const last = i === items.length - 1;
          return (
            <span key={it.path} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              {i > 0 && <span className="crumb-sep" aria-hidden="true">/</span>}
              {last ? (
                <span className="crumb-current" aria-current="page">
                  {it.name}
                </span>
              ) : (
                <Link href={it.path}>{it.name}</Link>
              )}
            </span>
          );
        })}
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}