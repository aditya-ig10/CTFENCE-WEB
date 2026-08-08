"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { FeatureIcon } from "@/components/FeatureIcon";
import { features } from "@/content/copy";
import { motionAllowed } from "@/lib/anim";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function Features() {
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!motionAllowed()) return;
      const cards = gridRef.current?.querySelectorAll(":scope > .feat");
      if (!cards?.length) return;
      const ctx = gsap.context(() => {
        gsap.set(cards, { opacity: 0, y: 20 });
        gsap.to(cards, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: { trigger: gridRef.current, start: "top 82%", once: true },
        });
      }, gridRef);
      return () => ctx.revert();
    },
    { scope: gridRef }
  );

  return (
    <section className="section" id="features" aria-labelledby="features-title">
      <div className="section-eyebrow">{features.eyebrow}</div>
      <h2 className="section-title" id="features-title">{features.title}</h2>
      <p className="section-lead">{features.lead}</p>
      <div className="features-grid" ref={gridRef}>
        {features.grid.map((f) => (
          <article className="feat" key={f.title}>
            <FeatureIcon name={f.icon} alt={f.alt} />
            <h3 className="feat-title">
              {f.title}
              {f.roadmap && <span className="roadmap-flag">Roadmap</span>}
            </h3>
            <p className="feat-desc">{f.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}