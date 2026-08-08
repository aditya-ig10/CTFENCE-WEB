"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { cases } from "@/content/copy";
import { motionAllowed } from "@/lib/anim";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function CaseStudies() {
  const gridRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!motionAllowed()) return;
      const cards = gridRef.current?.querySelectorAll(":scope > .case-card");
      if (!cards?.length) return;
      const ctx = gsap.context(() => {
        gsap.set(cards, { opacity: 0, y: 16 });
        gsap.to(cards, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: { trigger: gridRef.current, start: "top 85%", once: true },
        });
      }, gridRef);
      return () => ctx.revert();
    },
    { scope: gridRef }
  );

  return (
    <section className="section" id="cases" aria-labelledby="cases-title">
      <div className="section-eyebrow">{cases.eyebrow}</div>
      <h2 className="section-title" id="cases-title">{cases.title}</h2>
      <p className="section-lead">{cases.lead}</p>
      <div className="cases-grid" ref={gridRef}>
        {cases.cards.map((c) => (
          <article className="case-card" key={c.role}>
            <div className="case-head">
              <h3 className="case-role">{c.role}</h3>
              <span className="case-note">{c.note}</span>
            </div>
            {c.blocks.map((b) => (
              <div className="case-block" key={b.label}>
                {b.label}
                <p>{b.text}</p>
              </div>
            ))}
          </article>
        ))}
      </div>
    </section>
  );
}