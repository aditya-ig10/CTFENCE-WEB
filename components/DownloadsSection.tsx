"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { downloads } from "@/content/copy";
import type { DownloadsData } from "@/lib/releases";
import { Copy, Check, Laptop, Monitor, ArrowUpRight, Download } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

// authentic Apple logo mark (lucide's fruit outline reads wrong at small sizes)
function AppleLogo({ size = 17 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 384 512" fill="currentColor" aria-hidden="true">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

function useOS() {
  const [os, setOs] = useState<"mac" | "win" | "linux" | null>(null);
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("mac")) setOs("mac");
    else if (ua.includes("win")) setOs("win");
    else if (ua.includes("linux") || ua.includes("x11")) setOs("linux");
  }, []);
  return os;
}

// minimal downloads — quiet hairline rows, one install line, no boxes.
// the primary (OS-detected) build gets a single calm banner row.
export default function DownloadsSection({ release }: { release?: DownloadsData }) {
  const d = release ?? downloads;
  const os = useOS();
  const rootRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      // rise-only motion, no opacity fade — one-shot each.
      gsap.from(".dlm-hero > *", { y: 12, duration: 0.6, stagger: 0.07, ease: "power3.out", scrollTrigger: { trigger: root, start: "top 82%", once: true } });
      gsap.from(".dlm-tile", { y: 14, duration: 0.5, stagger: 0.08, ease: "power3.out", scrollTrigger: { trigger: ".dlm-tiles", start: "top 88%", once: true } });
      gsap.from(".dlm-big", { y: 16, duration: 0.6, ease: "power3.out", scrollTrigger: { trigger: ".dlm-big", start: "top 88%", once: true } });
    }, root);
    return () => ctx.revert();
  }, []);

  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1600);
  };

  // quick-install one-liners, built live from the release manifest so the
  // URLs (and version) never drift from the buttons below.
  const installs = [
    { id: "mac", label: "macOS", cmd: `curl -L -o Context-Fence.dmg ${d.mac.href} && hdiutil attach Context-Fence.dmg` },
    { id: "win", label: "Windows", cmd: `Invoke-WebRequest -Uri ${d.windows.href} -OutFile cf-setup.exe; Start-Process ./cf-setup.exe` },
    { id: "linux", label: "Linux", cmd: `curl -L -o context-fence ${d.linux.href} && chmod +x context-fence && ./context-fence` },
  ];
  // device-specific only — one row for the visitor's OS, nothing else.
  const install = installs.find((i) => i.id === os) ?? null;

  const platforms = [
    { ...d.mac, name: "macOS", detail: `universal dmg · ${d.mac.size}`, icon: <AppleLogo size={20} />, id: "mac" },
    { ...d.windows, name: "Windows", detail: `installer · ${d.windows.size}`, icon: <Laptop size={20} strokeWidth={1.5} />, id: "win" },
    { ...d.linux, name: "Linux", detail: `appimage · ${d.linux.size}`, icon: <Monitor size={20} strokeWidth={1.5} />, id: "linux" },
  ];
  const primary =
    os === "mac" ? platforms[0] : os === "win" ? platforms[1] : os === "linux" ? platforms[2] : null;
  const others = platforms.filter((p) => p !== primary);
  const primaryName = os === "mac" ? "Mac" : os === "win" ? "Windows" : "Linux";

  // compact bento tile for the non-primary platforms — horizontal in the
  // bento rail (fixed 16:9), vertical in the three-up fallback grid.
  const altPkgs = (p: (typeof platforms)[number]) => {
    if (p.id !== "linux") return null;
    const { debHref, rpmHref } = p as { debHref?: string; rpmHref?: string };
    if (typeof debHref !== "string" && typeof rpmHref !== "string") return null;
    return (
      <span className="dlm-alt">
        also:{" "}
        {typeof debHref === "string" && <a href={debHref} download>deb</a>}
        {typeof debHref === "string" && typeof rpmHref === "string" && " · "}
        {typeof rpmHref === "string" && <a href={rpmHref} download>rpm</a>}
      </span>
    );
  };
  const tile = (p: (typeof platforms)[number]) => (
    <li key={p.id} className={`dlm-tile dlm-accent--${p.id}`}>
      <span className="dlm-tile-icon">{p.icon}</span>
      <div className="dlm-tile-body">
        <div className="dlm-tile-name">{p.name}</div>
        <div className="dlm-tile-meta">{p.size} · v{d.version}</div>
        <p className="dlm-tile-sub">{p.sub}</p>
        <button
          type="button"
          className="dlm-sha"
          onClick={() => copy(p.sha256, `sha-${p.id}`)}
          title="Copy full sha256"
        >
          {copied === `sha-${p.id}` ? <Check size={12} /> : <Copy size={12} />}
          <span>sha256 {p.sha256.slice(0, 12)}…</span>
        </button>
        {altPkgs(p)}
      </div>
      <a href={p.href} download className="dlm-tile-cta">Download <ArrowUpRight size={14} /></a>
    </li>
  );

  return (
    <section ref={rootRef} className="dlm">
      <div className="dlm-hero">
        <div className="dlm-eyebrow">
          <span className="dl-pulse" />
          install · v{d.version} · {d.released}
        </div>
        <h1 className="dlm-title">Get the fence.</h1>
        <p className="dlm-sub">Native builds for every OS. Nothing leaves your machine — that is the point.</p>
        {install && (
          <div className="dlm-installs">
            <div className="dlm-install">
              <span className="dlm-install-cmd">{install.cmd}</span>
              <button
                type="button"
                className="dlm-copy"
                onClick={() => copy(install.cmd, `install-${install.id}`)}
                aria-label={`Copy ${install.label} install command`}
              >
                {copied === `install-${install.id}` ? <Check size={13} /> : <Copy size={13} />}
              </button>
            </div>
          </div>
        )}
      </div>

      {primary ? (
        <div className="dlm-bento">
          <div className={`dlm-big dlm-accent--${primary.id}`}>
            <div className="dlm-big-top">
              <span className="dlm-big-icon">{primary.icon}</span>
              <span className="dlm-big-label">For your {primaryName}</span>
            </div>
            <div className="dlm-big-name">{primary.name}</div>
            <div className="dlm-big-meta">v{d.version} · {primary.size}</div>
            <p className="dlm-big-note">{primary.sub}</p>
            <button
              type="button"
              className="dlm-sha dlm-big-sha"
              onClick={() => copy(primary.sha256, "sha-primary")}
              title="Copy full sha256"
            >
              {copied === "sha-primary" ? <Check size={12} /> : <Copy size={12} />}
              <span>sha256 {primary.sha256.slice(0, 20)}…</span>
            </button>
            {altPkgs(primary)}
            <a href={primary.href} download className="dlm-big-cta">
              <Download size={15} /> {primary.cta}
            </a>
          </div>
          <ul className="dlm-tiles">{others.map(tile)}</ul>
        </div>
      ) : (
        <ul className="dlm-tiles dlm-tiles--trio">{platforms.map(tile)}</ul>
      )}

      <div className="dlm-foot">
        <button type="button" className="dlm-sha" onClick={() => copy("shasum -a 256 Context-Fence-*", "verify")}>
          {copied === "verify" ? <Check size={12} /> : <Copy size={12} />}
          <span>shasum -a 256 Context-Fence-*</span>
        </button>
        <span className="dlm-foot-note">mac builds are ad-hoc signed, not notarized · verify the hash after downloading</span>
      </div>
    </section>
  );
}
