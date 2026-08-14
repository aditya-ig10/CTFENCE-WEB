import TermsEdition from "@/components/TermsEdition";
import { baseMetadata } from "@/lib/seo";

export const metadata = baseMetadata({
  title: "Terms of Service",
  description:
    "Context Fence terms of service, a product of Synthrun: the local core is free, builds are unsigned by design, and we make no warranty the fence catches everything.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <main>
      <TermsEdition />
    </main>
  );
}