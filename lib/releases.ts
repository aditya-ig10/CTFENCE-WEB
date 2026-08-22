import { downloads } from "@/content/copy";

export type ReleasePlatformPatch = {
  label?: string;
  sub?: string;
  size?: string;
  sha256?: string;
  href?: string;
  unsigned?: string;
  cta?: string;
  install?: string;
  update?: string;
  // linux-only: the AppImage is the primary href; the package-manager
  // artifacts ride along on the same release
  debHref?: string;
  rpmHref?: string;
};

export type ReleaseManifest = {
  version?: string;
  released?: string;
  platforms?: Record<string, ReleasePlatformPatch>;
};

export type DownloadsData = {
  version: string;
  released: string;
  mac: typeof downloads.mac;
  brew: typeof downloads.brew;
  windows: typeof downloads.windows;
  linux: typeof downloads.linux;
  cli: typeof downloads.cli;
};

// The website refetches this on a rolling 10-minute cadence (ISR) and falls
// back to the copy defaults whenever the manifest is unreachable or invalid,
// so a stale or offline build never breaks the page.
//
// The manifest lives in the PUBLIC releases repo
// (aditya-ig10/context-fence-releases) — the single public home for release
// assets and the manifest since v1.1.8-a; the app repo is private, so
// raw.githubusercontent.com 404s there. The sync-release-manifest workflow
// copies release.json over after each release.
const RELEASE_URL =
  process.env.CTFENCE_RELEASE_URL ??
  "https://raw.githubusercontent.com/aditya-ig10/context-fence-releases/main/release.json";

const REVALIDATE_SECONDS = 120;

function isManifest(v: unknown): v is ReleaseManifest {
  if (!v || typeof v !== "object") return false;
  const m = v as Record<string, unknown>;
  if (m.version !== undefined && typeof m.version !== "string") return false;
  if (m.released !== undefined && typeof m.released !== "string") return false;
  if (
    m.platforms !== undefined &&
    (typeof m.platforms !== "object" || m.platforms === null)
  ) {
    return false;
  }
  return true;
}

export async function getLatestRelease(): Promise<ReleaseManifest | null> {
  try {
    const res = await fetch(RELEASE_URL, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    if (!res.ok) return null;
    const json: unknown = await res.json();
    return isManifest(json) ? json : null;
  } catch {
    return null;
  }
}

// Merge the manifest over the copy defaults, field by field — a missing or
// empty platform leaves the hardcoded fallback untouched.
export function buildDownloads(manifest: ReleaseManifest | null): DownloadsData {
  const patch = (key: string): ReleasePlatformPatch =>
    manifest?.platforms?.[key] ?? {};
  return {
    version: manifest?.version ?? downloads.version,
    released: manifest?.released ?? downloads.released,
    mac: { ...downloads.mac, ...patch("mac") },
    brew: { ...downloads.brew, ...patch("brew") },
    windows: { ...downloads.windows, ...patch("windows") },
    linux: { ...downloads.linux, ...patch("linux") },
    cli: { ...downloads.cli, ...patch("cli") },
  };
}