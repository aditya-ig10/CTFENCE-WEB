"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { breadcrumbSchema } from "@/lib/seo";

// label lookup for route segments; anything unknown falls back to the raw segment
const LABELS: Record<string, string> = {
  evidence: "Evidence",
  downloads: "Downloads",
  docs: "Docs",
  blog: "Blog",
  team: "Team",
  privacy: "Privacy",
  terms: "Terms",
  "thank-you": "Thank you",
};

function HomeIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5.5 9.5V21h13V9.5" />
    </svg>
  );
}

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
            <span
              key={it.path}
              style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              {i > 0 && (
                <span className="crumb-sep" aria-hidden="true">
                  ›
                </span>
              )}
              {last ? (
                <span className="crumb-current" aria-current="page">
                  {i === 0 && <HomeIcon />}
                  {it.name}
                </span>
              ) : (
                <Link href={it.path}>
                  {i === 0 && <HomeIcon />}
                  {it.name}
                </Link>
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
