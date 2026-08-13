"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motionAllowed } from "@/lib/anim";
import { downloads } from "@/content/copy";
import type { DownloadsData } from "@/lib/releases";
import CopyButton from "@/components/CopyButton";
import DownloadPanel from "@/components/DownloadPanel";

gsap.registerPlugin(ScrollTrigger);

const iconProps = {
  width: 28,
  height: 28,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function AppleIcon() {
  return (
    <svg {...iconProps} fill="currentColor" stroke="none">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l-.01.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function WindowsIcon() {
  return (
    <svg {...iconProps} fill="currentColor" stroke="none">
      <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
    </svg>
  );
}

function TerminalIcon() {
  return (
    <svg {...iconProps}>
      <path data-draw d="M4 17l6-5-6-5" />
      <path data-draw d="M12 19h8" />
    </svg>
  );
}

function ArrowDownIcon() {
  return (
    <svg {...iconProps} width={14} height={14}>
      <path d="M12 4v11M7 11.5l5 4.5 5-4.5" />
    </svg>
  );
}

type PlatformKey = "mac" | "win" | "brew";

function PlatformCell({
  num,
  icon,
  title,
  sub,
  version,
  stats,
  flag,
  children,
}: {
  num: string;
  icon: React.ReactNode;
  title: string;
  sub: string;
  version: string;
  stats?: React.ReactNode;
  flag?: string;
  children?: React.ReactNode;
}) {
  return (
    <article className="dl-cell">
      <div className="dl-cell-top">
        <span className="dl-cell-num" aria-hidden="true">
          {num}
        </span>
        <span className="dl-cell-icon">{icon}</span>
      </div>
      <h2 className="dl-cell-title">{title}</h2>
      <p className="dl-cell-sub">{sub}</p>
      <div className="dl-ver-row">
        <span className="dl-ver">v{version}</span>
      </div>
      {stats && <div className="dl-cell-stats">{stats}</div>}
      {flag && <p className="dl-cell-flag">{flag}</p>}
      {children && <div className="dl-cell-action">{children}</div>}
    </article>
  );
}

export default function DownloadsSection({ release }: { release?: DownloadsData }) {
  const d = release ?? downloads;
  const rootRef = useRef<HTMLElement>(null);
  const [panelFor, setPanelFor] = useState<PlatformKey>("mac");
  const [panelOpen, setPanelOpen] = useState(false);

  const openPanel = (key: PlatformKey) => {
    setPanelFor(key);
    setPanelOpen(true);
  };

  const panelRows = [
    {
      key: "mac",
      icon: <AppleIcon />,
      label: d.mac.label,
      meta: `${d.mac.size} · sha256 ${d.mac.sha256.slice(0, 12)}…`,
      href: d.mac.href,
    },
    {
      key: "win",
      icon: <WindowsIcon />,
      label: d.windows.label,
      meta: `${d.windows.size} · sha256 ${d.windows.sha256.slice(0, 12)}…`,
      href: d.windows.href,
    },
  ];

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      // arm the stroke-draw icons before the trigger fires (skip when
      // reduced-motion — everything renders complete).
      if (motionAllowed()) {
        root.querySelectorAll<SVGPathElement>("[data-draw]").forEach((p) => {
          const len = p.getTotalLength();
          gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
        });
      }

      if (!motionAllowed()) {
        return;
      }

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: root,
          start: "top 78%",
          once: true,
        },
      });

      tl.fromTo(
        root.querySelectorAll(".dl-eyebrow, .dl-title, .dl-sub"),
        { y: 22, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.55, ease: "expo.out", stagger: 0.07 },
        0
      );
      tl.fromTo(
        root.querySelector(".dl-title .highlight"),
        { scaleX: 0 },
        {
          scaleX: 1,
          transformOrigin: "left center",
          duration: 0.45,
          ease: "power3.inOut",
          willChange: "transform",
          force3D: true,
        },
        0.3
      );

      // the four platforms come in one by one, each icon animating with it.
      const cells = root.querySelectorAll<HTMLElement>(".dl-cell");
      cells.forEach((cell, i) => {
        const at = 0.42 + i * 0.16;
        tl.fromTo(
          cell,
          { y: 46, autoAlpha: 0, scale: 0.97 },
          { y: 0, autoAlpha: 1, scale: 1, duration: 0.65, ease: "expo.out" },
          at
        );
        const svg = cell.querySelector(".dl-cell-icon svg");
        if (svg) {
          const drawn = svg.querySelectorAll<SVGPathElement>("[data-draw]");
          if (drawn.length) {
            drawn.forEach((p) => {
              tl.to(
                p,
                { strokeDashoffset: 0, duration: 0.75, ease: "power2.inOut" },
                at + 0.18
              );
            });
          } else {
            tl.fromTo(
              svg,
              { scale: 0.4, autoAlpha: 0 },
              { scale: 1, autoAlpha: 1, duration: 0.5, ease: "back.out(1.7)" },
              at + 0.12
            );
          }
        }
      });

      tl.fromTo(
        root.querySelector(".dl-foot"),
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.45, ease: "power2.out" },
        0.42 + cells.length * 0.16 + 0.25
      );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section
      className="section downloads"
      ref={rootRef}
      aria-labelledby="downloads-title"
    >
      <div className="dl-head">
        <div className="dl-eyebrow">
          <span className="dl-pulse" aria-hidden="true" />
          install · v{d.version} · {d.released}
        </div>
        <h1 className="dl-title" id="downloads-title">
          Get the <span className="highlight">fence.</span>
        </h1>
        <p className="dl-sub">
          One universal binary for macOS and Windows, a homebrew cask, and a
          sha256 for everything. Nothing leaves your machine — that is the
          point.
        </p>
      </div>

      <div className="dl-band">
        <div className="dl-grid">
          <PlatformCell
            num="01"
            icon={<AppleIcon />}
            title="macOS"
            sub={d.mac.sub}
            flag={d.mac.unsigned}
            version={d.version}
            stats={
              <>
                <span>{d.mac.size}</span>
                <span className="dl-stat-sep" aria-hidden="true">·</span>
                <span className="dl-sha">sha256 {d.mac.sha256}</span>
              </>
            }
          >
            <button
              type="button"
              className="dl-btn"
              onClick={() => openPanel("mac")}
              aria-haspopup="dialog"
            >
              <span>{d.mac.cta}</span>
              <span className="dl-btn-arrow" aria-hidden="true">
                <ArrowDownIcon />
              </span>
            </button>
          </PlatformCell>

          <PlatformCell
            num="02"
            icon={<WindowsIcon />}
            title="Windows x64"
            sub={d.windows.sub}
            flag={d.windows.unsigned}
            version={d.version}
            stats={
              <>
                <span>{d.windows.size}</span>
                <span className="dl-stat-sep" aria-hidden="true">·</span>
                <span className="dl-sha">sha256 {d.windows.sha256}</span>
              </>
            }
          >
            <button
              type="button"
              className="dl-btn"
              onClick={() => openPanel("win")}
              aria-haspopup="dialog"
            >
              <span>{d.windows.cta}</span>
              <span className="dl-btn-arrow" aria-hidden="true">
                <ArrowDownIcon />
              </span>
            </button>
          </PlatformCell>

          <PlatformCell
            num="03"
            icon={<TerminalIcon />}
            title="Homebrew"
            sub={d.brew.sub}
            version={d.version}
            stats={<span className="dl-cmd-inline">{d.brew.install}</span>}
          >
            <CopyButton text={d.brew.install} />
          </PlatformCell>
        </div>

        <p className="dl-foot">
          every release ships with a fresh sha256 · verify before you run it
        </p>
      </div>

      <DownloadPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        rows={panelRows}
        activeKey={panelFor}
        version={d.version}
        released={d.released}
      />
    </section>
  );
}
