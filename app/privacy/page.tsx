import PrivacyEdition from "@/components/PrivacyEdition";
import { baseMetadata } from "@/lib/seo";

export const metadata = baseMetadata({
  title: "Privacy Policy",
  description:
    "Context Fence privacy policy, a product of Synthrun: local-only mode collects nothing, what the website sees, and how the future hosted control plane would handle the audit log.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <main>
      <PrivacyEdition />
    </main>
  );
}