import PrivacyEdition from "@/components/PrivacyEdition";
import WebPageSchema from "@/components/WebPageSchema";
import { baseMetadata } from "@/lib/seo";

export const metadata = baseMetadata({
  title: "Privacy Policy",
  description:
    "Context Fence privacy policy, a product of Synthrun: local-only mode collects nothing, what the website sees, and how the future hosted control plane would handle the audit log.",
  keywords: [
    "context fence privacy",
    "local AI proxy privacy",
    "no telemetry AI proxy",
    "MCP proxy data policy",
  ],
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <main>
      <WebPageSchema
        name="Privacy Policy — The Fine Print"
        description="What Context Fence collects: nothing in local mode. The website sees what any static site sees."
        path="/privacy"
      />
      <PrivacyEdition />
    </main>
  );
}