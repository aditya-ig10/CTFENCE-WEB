import { baseMetadata } from "@/lib/seo";
import { buildDownloads, getLatestRelease } from "@/lib/releases";
import DownloadsSection from "@/components/DownloadsSection";
import WebPageSchema from "@/components/WebPageSchema";

export async function generateMetadata() {
  const manifest = await getLatestRelease();
  const version = manifest?.version ?? "2.0.0";
  return baseMetadata({
    image: "/og/downloads.png",
  title: "Downloads",
    description: `Download Context Fence ${version} — a local firewall for what AI agents send out. Today it protects MCP tools. Universal macOS dmg, Homebrew tap, Windows installer, and Linux AppImage/deb/rpm builds with published sha256 checksums.`,
    keywords: [
      "download context fence",
      "AI agent DLP download",
      "macOS AI agent security",
      "homebrew tap",
      "linux AI agent firewall AppImage",
      "deb rpm agent security",
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
        description="Context Fence releases: universal macOS dmg, Homebrew tap, Windows installer, and Linux AppImage/deb/rpm builds with sha256 checksums."
        path="/downloads"
      />
      <DownloadsSection release={buildDownloads(manifest)} />
    </>
  );
}