import IssueChart from "@/components/IssueChart";
import WebPageSchema from "@/components/WebPageSchema";
import { baseMetadata } from "@/lib/seo";

export const metadata = baseMetadata({
  title: "Evidence",
  description:
    "The MCP attack surface, mapped end-to-end: sixteen distinct security risks across four attacker classes, each confirmed with a working exploit.",
  keywords: [
    "MCP attack surface",
    "MCP security risks",
    "AI agent exploit research",
    "prompt injection evidence",
    "MCP tool call vulnerabilities",
    "agent secret leakage survey",
  ],
  path: "/evidence",
});

export default function EvidencePage() {
  return (
    <>
      <WebPageSchema
        name="Evidence — the MCP attack surface"
        description="Sixteen confirmed MCP security risks across four attacker classes, each with a working exploit."
        path="/evidence"
      />
      <IssueChart />
    </>
  );
}