import BlogComingSoon from "@/components/BlogComingSoon";
import WebPageSchema from "@/components/WebPageSchema";
import { baseMetadata } from "@/lib/seo";

export const metadata = baseMetadata({
  title: "Blog",
  description:
    "The Context Fence press room. Coming soon: the July 18 incident breakdown, schema checks vs. vibe checks, and how the evidence survey was run.",
  keywords: [
    "context fence blog",
    "MCP security news",
    "AI agent incidents",
    "schema checks vs vibe checks",
    "agent security field notes",
  ],
  path: "/blog",
});

export default function BlogPage() {
  return (
    <>
      <WebPageSchema
        name="Blog — The Press Room"
        description="Field notes and incident breakdowns from the Context Fence team."
        path="/blog"
      />
      <BlogComingSoon />
    </>
  );
}