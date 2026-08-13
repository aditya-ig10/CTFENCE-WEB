import { baseMetadata } from "@/lib/seo";
import { buildDownloads, getLatestRelease } from "@/lib/releases";
import DownloadsSection from "@/components/DownloadsSection";

export async function generateMetadata() {
  const manifest = await getLatestRelease();
  const version = manifest?.version ?? "1.1.6-c";
  return baseMetadata({
    title: "Downloads",
    description: `Context Fence ${version} — universal macOS dmg and homebrew tap. One binary for Intel and Apple silicon.`,
    path: "/downloads",
  });
}

export default async function DownloadsPage() {
  const manifest = await getLatestRelease();
  return <DownloadsSection release={buildDownloads(manifest)} />;
}