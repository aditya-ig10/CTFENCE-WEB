"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { motionAllowed } from "@/lib/anim";

type MastheadProps = {
  variant?: "front" | "legal";
  barLeft: string;
  barMid?: string;
  barRight: string;
  nameplate: string;
  tagline?: string;
  ticker?: string[];
};

// the printed nameplate. front = full-size, legal = half-sheet. both share
// the double-rule frame and the ink-on-paper reveal.
export default function NewspaperMasthead({
  variant = "front",
  barLeft,
  barMid,
  barRight,
  nameplate,
  tagline,
  ticker,
}: MastheadProps) {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !motionAllowed()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        root.querySelectorAll(".paper-bar > *"),
        { autoAlpha: 0, y: 6 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: root, start: "top 92%", once: true },
        }
      );
      gsap.fromTo(
        root.querySelectorAll(".paper-nameplate, .paper-tagline"),
        { autoAlpha: 0, y: 18, clipPath: "inset(0 0 100% 0)" },
        {
          autoAlpha: 1,
          y: 0,
          clipPath: "inset(0 0 0% 0)",
          duration: 0.9,
          stagger: 0.12,
          ease: "expo.out",
          scrollTrigger: { trigger: root, start: "top 90%", once: true },
        }
      );
      gsap.fromTo(
        root.querySelectorAll(".paper-rule-thin, .paper-rule-thick"),
        { scaleX: 0 },
        {
          scaleX: 1,
          transformOrigin: "left center",
          duration: 0.7,
          stagger: 0.1,
          ease: "power3.inOut",
          scrollTrigger: { trigger: root, start: "top 90%", once: true },
        }
      );
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <header className={`paper-masthead paper-masthead--${variant}`} ref={rootRef}>
      <div className="paper-bar">
        <span>{barLeft}</span>
        {barMid ? <span className="paper-bar-mid">{barMid}</span> : null}
        <span className="paper-bar-right">{barRight}</span>
      </div>
      <div className="paper-rule-thin" aria-hidden="true" />
      <h1 className="paper-nameplate">{nameplate}</h1>
      {tagline ? <p className="paper-tagline">{tagline}</p> : null}
      <div className="paper-rule-thick" aria-hidden="true" />
      <div className="paper-rule-thin" aria-hidden="true" />
      {variant === "front" && ticker?.length ? (
        <div className="paper-ticker" aria-hidden="true">
          <div className="paper-ticker-track">
            {[0, 1].map((half) => (
              <span className="paper-ticker-run" key={half}>
                {ticker.map((t, i) => (
                  <span className="paper-ticker-item" key={i}>
                    <span>{t}</span>
                    <span className="paper-ticker-sep">✦</span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </header>
  );
}

// the rubber stamp — rotated red ink, multiplies into the paper.
export function PaperStamp({ text = "approved for print" }: { text?: string }) {
  return (
    <span className="paper-stamp" aria-hidden="true">
      <span className="paper-stamp-inner">{text}</span>
    </span>
  );
}