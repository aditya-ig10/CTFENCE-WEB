import TermsEdition from "@/components/TermsEdition";
import WebPageSchema from "@/components/WebPageSchema";
import { baseMetadata } from "@/lib/seo";

export const metadata = baseMetadata({
  title: "Terms of Service",
  description:
    "Context Fence terms of service, a product of Synthrun: the local core is free, builds are unsigned by design, and we make no warranty the fence catches everything.",
  keywords: [
    "context fence terms",
    "MCP proxy license",
    "free local AI proxy",
    "synthrun terms",
  ],
  path: "/terms",
});

export default function TermsPage() {
  return (
    <main>
      <WebPageSchema
        name="Terms of Service — The Contract Corner"
        description="The ground rules for Context Fence: free local core, unsigned builds by design, no warranty."
        path="/terms"
      />
      <TermsEdition />
    </main>
  );
}