import TeamGrid from "@/components/TeamGrid";
import WebPageSchema from "@/components/WebPageSchema";
import { baseMetadata } from "@/lib/seo";

export const metadata = baseMetadata({
  title: "Team",
  description:
    "The people behind Context Fence — the founders at the protocol layer and the three hands keeping the build honest.",
  keywords: [
    "context fence team",
    "synthrun founders",
    "MCP proxy makers",
    "AI agent security team",
  ],
  path: "/team",
});

export default function TeamPage() {
  return (
    <>
      <WebPageSchema
        name="Team — The People Edition"
        description="The founders and crew behind Context Fence, printed as a newspaper edition."
        path="/team"
      />
      <TeamGrid />
    </>
  );
}