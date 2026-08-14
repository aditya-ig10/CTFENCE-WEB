import BlogComingSoon from "@/components/BlogComingSoon";
import { baseMetadata } from "@/lib/seo";

export const metadata = baseMetadata({
  title: "Blog",
  description:
    "Context Fence press room. Coming soon: the July 18 incident breakdown, schema checks vs. vibe checks, and how the evidence survey was run.",
  path: "/blog",
});

export default function BlogPage() {
  return <BlogComingSoon />;
}