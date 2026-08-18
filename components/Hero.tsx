"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import gsap from "gsap";
import { hero } from "@/content/copy";
import { motionAllowed } from "@/lib/anim";
import SplitText from "@/components/SplitText";

export default function Hero() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // scroll hint fades out once the user starts scrolling
    const hint = root.querySelector<HTMLElement>(".hero-scroll-hint");
    const onScroll = () => {
      if (!hint) return;
      const hidden = window.scrollY > 32;
      if (!motionAllowed()) {
        hint.style.opacity = hidden ? "0" : "1";
        return;
      }
      gsap.to(hint, {
        autoAlpha: hidden ? 0 : 1,
        duration: 0.35,
        ease: "power2.out",
        overwrite: true,
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    if (!motionAllowed()) {
      return () => window.removeEventListener("scroll", onScroll);
    }

    const ctx = gsap.context(() => {
      gsap.set(".hero-reveal", { opacity: 0, y: 18 });
      [
        { sel: ".hero-sub", at: 0.7 },
        { sel: ".hero-actions", at: 0.9 },
        { sel: ".hero-scroll-hint", at: 1.15 },
      ].forEach(({ sel, at }) => {
        gsap.to(sel, {
          opacity: 1,
          y: 0,
          duration: 0.45,
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
          duration: 0.3,
          delay: 0.55,
          ease: "power3.inOut",
          willChange: "transform",
          force3D: true,
        }
      );
    }, root);
    return () => {
      window.removeEventListener("scroll", onScroll);
      ctx.revert();
    };
  }, []);

  return (
    <section className="hero" id="hero-top" ref={rootRef}>
      <div className="hero-inner">
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
                    startDelay={0.55}
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
                  startDelay={i * 0.18 + 0.15}
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
        </div>
      </div>
      <div className="hero-scroll-hint hero-reveal" aria-hidden="true">
        <ChevronDown className="hero-scroll-arrow" />
        <ChevronDown className="hero-scroll-arrow" />
        <ChevronDown className="hero-scroll-arrow" />
      </div>
    </section>
  );
}