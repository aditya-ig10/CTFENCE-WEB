import WebPageSchema from "@/components/WebPageSchema";
import { docs } from "@/content/copy";
import { baseMetadata } from "@/lib/seo";

export const metadata = baseMetadata({
  image: "/og/docs.png",
  title: "Docs",
  description:
    "Context Fence docs: the YAML policy file, what the proxy checks, and the local SQLite audit log.",
  keywords: [
    "context fence docs",
    "cf.policy.yml",
    "MCP proxy policy file",
    "agent audit log",
    "policy rules YAML",
  ],
  path: "/docs",
});

export default function DocsPage() {
  return (
    <main className="prose-page">
      <WebPageSchema
        name="Docs"
        description="The policy file, the checks the proxy runs, and the local SQLite audit log."
        path="/docs"
      />
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