import { docs } from "@/content/copy";
import { baseMetadata } from "@/lib/seo";

export const metadata = baseMetadata({
  title: "Docs",
  description:
    "Context Fence docs: the YAML policy file, what the proxy checks, and the local SQLite audit log.",
  path: "/docs",
});

export default function DocsPage() {
  return (
    <main className="prose-page">
      <h1>{docs.title}</h1>
      <div className="updated">{docs.updated}</div>
      <div className="prose-body">
        {docs.sections.map((s) => (
          <div key={s.h}>
            <h2>{s.h}</h2>
            <p>{s.p}</p>
          </div>
        ))}
      </div>
    </main>
  );
}