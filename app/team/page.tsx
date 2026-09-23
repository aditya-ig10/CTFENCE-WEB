import TeamGrid from "@/components/TeamGrid";
import WebPageSchema from "@/components/WebPageSchema";
import { baseMetadata } from "@/lib/seo";

export const metadata = baseMetadata({
  title: "Team",
  description: "The Context Fence team — five hands holding the fence. Built by Synthrun.",
  path: "/team",
});

export default function TeamPage() {
  return (
    <main>
      <WebPageSchema name="Team — Context Fence" description="Five hands holding the fence." path="/team" />
      <TeamGrid />
    </main>
  );
}
