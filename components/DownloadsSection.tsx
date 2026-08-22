"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { animate } from "animejs";
import { motionAllowed } from "@/lib/anim";
import { downloads } from "@/content/copy";
import type { DownloadsData } from "@/lib/releases";

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

function LinuxIcon() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="3.5" width="18" height="17" rx="3" />
      <path d="M8.5 9.5h7M8.5 13h7M8.5 16.5h4" />
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

function PlatformCell({
  num,
  rot,
  chip,
  icon,
  title,
  sub,
  sticker,
  meta,
  sha,
  flag,
  children,
}: {
  num: string;
  rot: string;
  chip: string;
  icon: React.ReactNode;
  title: string;
  sub: string;
  sticker: string;
  meta?: React.ReactNode;
  sha?: string;
  flag?: string;
  children?: React.ReactNode;
}) {
  return (
    <article
      className="dl-cell"
      data-num={num}
      style={{ "--rot": rot } as React.CSSProperties}
    >
      <span className="dl-cell-num" aria-hidden="true">
        {num}
      </span>
      <span className={`dl-chip ${chip}`}>{icon}</span>
      <h2 className="dl-cell-title">{title}</h2>
      <p className="dl-cell-sub">{sub}</p>
      <div className="dl-cell-meta">
        <span className="dl-sticker">{sticker}</span>
        {meta && <span className="dl-meta">{meta}</span>}
      </div>
      {sha && <p className="dl-sha">sha256 {sha}</p>}
      {flag && <p className="dl-cell-flag">{flag}</p>}
      {children && <div className="dl-cell-action">{children}</div>}
    </article>
  );
}

export default function DownloadsSection({ release }: { release?: DownloadsData }) {
  const d = release ?? downloads;
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // anime.js — idle loops: chips bob, floaters sway
    const loops: ReturnType<typeof animate>[] = [];
    if (motionAllowed()) {
      root.querySelectorAll<HTMLElement>(".dl-chip").forEach((chip, i) => {
        loops.push(
          animate(chip, {
            translateY: [-2, 3],
            rotate: [-3, 3],
            duration: 2400 + i * 240,
            direction: "alternate",
            loop: true,
            ease: "inOutQuad",
            delay: i * 260,
          })
        );
      });
    }

    // gsap — scroll choreography, bouncy entrance
    const ctx = gsap.context(() => {
      if (!motionAllowed()) return;

      const tl = gsap.timeline({
        scrollTrigger: { trigger: root, start: "top 78%", once: true },
      });

      tl.fromTo(
        root.querySelectorAll(".dl-eyebrow, .dl-title, .dl-sub"),
        { y: 24, autoAlpha: 0 },
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
        },
        0.3
      );

      const cells = root.querySelectorAll<HTMLElement>(".dl-cell");
      cells.forEach((cell, i) => {
        const rot = parseFloat(getComputedStyle(cell).getPropertyValue("--rot")) || 0;
        const at = 0.42 + i * 0.14;
        tl.fromTo(
          cell,
          { y: 64, autoAlpha: 0, rotation: rot * 2.6 },
          { y: 0, autoAlpha: 1, rotation: rot, duration: 0.7, ease: "back.out(1.6)" },
          at
        );
        tl.fromTo(
          cell.querySelector(".dl-chip"),
          { scale: 0, rotation: -40 },
          { scale: 1, rotation: 0, duration: 0.5, ease: "back.out(2.2)" },
          at + 0.22
        );
        tl.fromTo(
          cell.querySelector(".dl-sticker"),
          { scale: 0, rotation: 70 },
          { scale: 1, rotation: 0, duration: 0.45, ease: "back.out(2.6)" },
          at + 0.3
        );
        tl.fromTo(
          cell.querySelector(".dl-cell-num"),
          { y: 36, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.5, ease: "expo.out" },
          at + 0.34
        );
        tl.fromTo(
          cell.querySelectorAll(".dl-meta, .dl-sha, .dl-cell-flag"),
          { autoAlpha: 0 },
          { autoAlpha: 1, duration: 0.4, ease: "power2.out", stagger: 0.05 },
          at + 0.4
        );
      });
    }, root);

    return () => {
      loops.forEach((a) => a.pause());
      ctx.revert();
    };
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
          Native builds for macOS, Windows and Linux — a sha256 for everything.
          Nothing leaves your machine, that is the point.
        </p>
      </div>

      <div className="dl-grid">
        <PlatformCell
          num="01"
          rot="1.2deg"
          chip="dl-chip--mac"
          icon={<AppleIcon />}
          title="macOS"
          sub={d.mac.sub}
          sticker={`v${d.version}`}
          meta={d.mac.size}
          sha={d.mac.sha256}
          flag={d.mac.unsigned}
        >
          <a className="dl-btn dl-btn--mac" href={d.mac.href} download>
            <span>{d.mac.cta}</span>
            <span className="dl-btn-arrow" aria-hidden="true">
              <ArrowDownIcon />
            </span>
          </a>
        </PlatformCell>

        <PlatformCell
          num="02"
          rot="-1.1deg"
          chip="dl-chip--win"
          icon={<WindowsIcon />}
          title="Windows x64"
          sub={d.windows.sub}
          sticker={`v${d.version}`}
          meta={d.windows.size}
          sha={d.windows.sha256}
          flag={d.windows.unsigned}
        >
          <a className="dl-btn dl-btn--win" href={d.windows.href} download>
            <span>{d.windows.cta}</span>
            <span className="dl-btn-arrow" aria-hidden="true">
              <ArrowDownIcon />
            </span>
          </a>
        </PlatformCell>

        <PlatformCell
          num="03"
          rot="0.9deg"
          chip="dl-chip--linux"
          icon={<LinuxIcon />}
          title="Linux x64"
          sub={d.linux.sub}
          sticker={`v${d.version}`}
          meta={d.linux.size}
          sha={d.linux.sha256}
          flag={d.linux.unsigned}
        >
          {d.linux.href ? (
            <div className="dl-linux">
              <a className="dl-btn dl-btn--linux" href={d.linux.href} download>
                <span>{d.linux.cta}</span>
                <span className="dl-btn-arrow" aria-hidden="true">
                  <ArrowDownIcon />
                </span>
              </a>
              {(d.linux.debHref || d.linux.rpmHref) && (
                <div className="dl-pkg-links">
                  {d.linux.debHref && (
                    <a className="dl-waitlist" href={d.linux.debHref} download>
                      .deb ↓
                    </a>
                  )}
                  {d.linux.rpmHref && (
                    <a className="dl-waitlist" href={d.linux.rpmHref} download>
                      .rpm ↓
                    </a>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="dl-linux">
              <span className="dl-btn dl-btn--linux dl-btn--soon" aria-disabled="true">
                Coming soon
              </span>
              <a className="dl-waitlist" href="/#early-access">
                join the waitlist →
              </a>
            </div>
          )}
        </PlatformCell>
      </div>
    </section>
  );
}