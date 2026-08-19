import { baseMetadata } from "@/lib/seo";
import { buildDownloads, getLatestRelease } from "@/lib/releases";
import DownloadsSection from "@/components/DownloadsSection";
import WebPageSchema from "@/components/WebPageSchema";

export async function generateMetadata() {
  const manifest = await getLatestRelease();
  const version = manifest?.version ?? "1.1.6-c";
  return baseMetadata({
    image: "/og/downloads.png",
  title: "Downloads",
    description: `Download Context Fence ${version} — the local MCP policy proxy for AI coding agents. Universal macOS dmg, Homebrew tap, and Windows builds with published sha256 checksums.`,
    keywords: [
      "download context fence",
      "MCP proxy download",
      "macOS AI agent security",
      "homebrew tap",
      "AI agent policy proxy install",
      "local LLM guardrails",
    ],
    path: "/downloads",
  });
}

export default async function DownloadsPage() {
  const manifest = await getLatestRelease();
  return (
    <>
      <WebPageSchema
        name="Downloads"
        description="Context Fence releases: universal macOS dmg, Homebrew tap, and Windows builds with sha256 checksums."
        path="/downloads"
      />
      <DownloadsSection release={buildDownloads(manifest)} />
    </>
  );
}