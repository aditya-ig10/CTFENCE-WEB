import Link from "next/link";
import { privacy } from "@/content/copy";
import { baseMetadata } from "@/lib/seo";

export const metadata = baseMetadata({
  title: "Privacy Policy",
  description:
    "Context Fence privacy policy: local-only mode collects nothing, what the website and early access form do, and how the future hosted control plane would handle the audit log.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <main className="prose-page">
      <h1>{privacy.title}</h1>
      <div className="updated">{privacy.updated}</div>
      <div className="prose-body">
        {privacy.sections.map((s) => (
          <div key={s.h}>
            <h2>{s.h}</h2>
            <p>{s.p}</p>
          </div>
        ))}
        <p>
          <Link href="/">Back to the site</Link>
        </p>
      </div>
    </main>
  );
}