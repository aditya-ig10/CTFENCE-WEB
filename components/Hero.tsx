"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { hero } from "@/content/copy";
import { motionAllowed } from "@/lib/anim";
import SplitText from "@/components/SplitText";

export default function Hero() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !motionAllowed()) return;
    const ctx = gsap.context(() => {
      gsap.set(".hero-reveal", { opacity: 0, y: 18 });
      [
        { sel: ".hero-sub", at: 3.2 },
        { sel: ".hero-actions", at: 3.8 },
        { sel: ".sla-badge", at: 4.4 },
      ].forEach(({ sel, at }) => {
        gsap.to(sel, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay: at,
          ease: "power2.out",
        });
      });
      gsap.fromTo(
        ".hero-title .highlight",
        { scaleX: 0 },
        {
          scaleX: 1,
          transformOrigin: "left center",
          duration: 0.4,
          delay: 1.95,
          ease: "power3.inOut",
          willChange: "transform",
          force3D: true,
        }
      );
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
              {l.highlight ? (
                <span className="highlight">
                  <SplitText
                    tag="span"
                    text={l.text}
                    className="hero-line"
                    delay={20}
                    duration={0.6}
                    ease="power3.out"
                    splitType="chars"
                    textAlign="left"
                    startDelay={1.95}
                  />
                </span>
              ) : (
                <SplitText
                  tag="span"
                  text={l.text}
                  className={l.accent ? "hero-line accent" : "hero-line"}
                  delay={20}
                  duration={0.6}
                  ease="power3.out"
                  splitType="chars"
                  textAlign="left"
                  startDelay={i * 0.45 + 0.5}
                />
              )}
              {i < hero.titleLines.length - 1 && <br />}
            </span>
          ))}
        </h1>
        <p className="hero-sub hero-reveal">{hero.sub}</p>
        <div className="hero-actions hero-reveal">
          <Link href={hero.primaryCta.href} className="btn-primary">
            {hero.primaryCta.label}
          </Link>
          <span className="sla-badge">
            <span aria-hidden="true">✓</span>
            {hero.slaBadge}
          </span>
        </div>
      </div>
    </section>
  );
}