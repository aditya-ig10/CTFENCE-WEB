import { webPageSchema } from "@/lib/seo";

// server-side JSON-LD for the current page — every subpage renders one
// line of this so scrapers get a typed WebPage entry linked into the site graph.
export default function WebPageSchema({
  name,
  description,
  path,
  image,
}: {
  name: string;
  description: string;
  path: string;
  image?: string;
}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(webPageSchema({ name, description, path, image })),
      }}
    />
  );
}
