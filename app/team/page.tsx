import TeamGrid from "@/components/TeamGrid";
import { baseMetadata } from "@/lib/seo";

export const metadata = baseMetadata({
  title: "Team",
  description:
    "The people behind Context Fence — the founders at the protocol layer and the three hands keeping the build honest.",
  path: "/team",
});

export default function TeamPage() {
  return <TeamGrid />;
}