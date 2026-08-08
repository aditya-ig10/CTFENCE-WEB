"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import HeroTerminal from "@/components/HeroTerminal";
import { hero } from "@/content/copy";
import { motionAllowed } from "@/lib/anim";

export default function Hero() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !motionAllowed()) return;
    const ctx = gsap.context(() => {
      gsap.set(".hero-reveal", { opacity: 0, y: 18 });
      gsap.to(".hero-reveal", {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: "power2.out",
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section className="hero" id="hero-top" ref={rootRef}>
      <div className="hero-inner">
        <div className="hero-tag hero-reveal">
          <span className="tag-dot" aria-hidden="true" />
          {hero.tag}
        </div>
        <h1 className="hero-title">
          {hero.titleLines.map((l, i) => (
            <span key={i}>
              <span className={l.accent ? "accent" : l.dim ? "dim" : undefined}>{l.text}</span>
              {i < hero.titleLines.length - 1 && <br />}
            </span>
          ))}
        </h1>
        <p className="hero-sub hero-reveal">{hero.sub}</p>
        <div className="hero-actions hero-reveal">
          <Link href={hero.primaryCta.href} className="btn-primary">
            {hero.primaryCta.label}
          </Link>
          <Link href={hero.secondaryCta.href} className="btn-ghost">
            {hero.secondaryCta.label}
          </Link>
          <span className="sla-badge">
            <span aria-hidden="true">✓</span>
            {hero.slaBadge}
          </span>
        </div>
        <div className="hero-reveal">
          <HeroTerminal />
        </div>
      </div>
    </section>
  );
}