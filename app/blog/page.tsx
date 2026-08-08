import { blog } from "@/content/copy";
import { baseMetadata } from "@/lib/seo";

export const metadata = baseMetadata({
  title: "Blog",
  description: "Context Fence blog. First post will be the July 18 incident breakdown.",
  path: "/blog",
});

export default function BlogPage() {
  return (
    <main className="prose-page">
      <h1>{blog.title}</h1>
      <div className="updated">{blog.updated}</div>
      <div className="prose-body">
        <p>{blog.body}</p>
      </div>
    </main>
  );
}