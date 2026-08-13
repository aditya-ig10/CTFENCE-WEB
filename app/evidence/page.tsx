import IssueChart from "@/components/IssueChart";
import { baseMetadata } from "@/lib/seo";

export const metadata = baseMetadata({
  title: "Evidence",
  description:
    "The MCP attack surface, mapped end-to-end: sixteen distinct security risks across four attacker classes, each confirmed with a working exploit.",
  path: "/evidence",
});

export default function EvidencePage() {
  return <IssueChart />;
}
