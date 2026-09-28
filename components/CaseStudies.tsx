"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motionAllowed } from "@/lib/anim";
import { cases } from "@/content/copy";
import { ArrowUpRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

export default function CaseStudies() {
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    if (!motionAllowed()) return;
    const section = row.closest<HTMLElement>("section");
    const cards = row.querySelectorAll<HTMLElement>(".cs-card");
    if (!section || cards.length === 0) return;

    const fill = section.querySelector<HTMLElement>(".pc-progress-fill");
    const head = section.querySelector<HTMLElement>(".pc-progress-head");
    const indexEl = section.querySelector<HTMLElement>(".pc-progress-index");
    const ticks = section.querySelectorAll<HTMLElement>(".pc-progress-tick");

    const ctx = gsap.context(() => {
      if (window.matchMedia("(min-width: 1024px)").matches) {
        // same opening as before, rotated: cards unfold bottom-to-top,
        // scrubbed to scroll, then stay open.
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: row,
            start: "top 88%",
            end: "top 30%",
            scrub: 0.4,
            once: true,
          },
        });
        cards.forEach((card, i) => {
          timeline.fromTo(
            card,
            { scaleY: 0.08, transformOrigin: "center bottom" },
            { scaleY: 1, transformOrigin: "center bottom", duration: 0.35, ease: "power2.inOut" },
            i * 0.22
          );
          card
            .querySelectorAll<HTMLElement>(".cs-num, .cs-top, .cs-title, .cs-role, .cs-block, .cs-tags")
            .forEach((el, k) => {
              timeline.fromTo(
                el,
                { y: 16 },
                { y: 0, duration: 0.3, ease: "power2.out" },
                i * 0.22 + 0.08 + k * 0.04
              );
            });
        });
      } else {
        gsap.fromTo(
          cards,
          { y: 24 },
          {
            y: 0,
            duration: 0.55,
            stagger: 0.09,
            ease: "power2.out",
            clearProps: "transform",
            scrollTrigger: { trigger: row, start: "top 88%", once: true },
          }
        );
      }

      ScrollTrigger.create({
        trigger: section,
        start: "top 85%",
        end: "bottom 60%",
        scrub: 0.5,
        onUpdate: (self) => {
          const p = gsap.utils.clamp(0, 1, self.progress);
          if (fill) gsap.set(fill, { scaleX: p });
          if (head) gsap.set(head, { left: `${p * 100}%` });
          const seg = Math.min(3, Math.floor(p * 4));
          ticks.forEach((t, i) => t.classList.toggle("is-on", i <= seg));
          if (indexEl) indexEl.textContent = String(seg + 1).padStart(2, "0");
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section className="section case-files" id="cases" aria-labelledby="cases-title" style={{ maxWidth: 1140, margin: "0 auto", padding: "0 2rem 4rem" }}>
      <div className="case-files-intro" style={{ maxWidth: 640, textAlign: "left", paddingTop: "clamp(32px, 5vw, 64px)", borderTop: "1px solid var(--rule)", marginBottom: "1.8rem" }}>
        <div className="section-eyebrow" style={{ textAlign: "left" }}>
          {cases.eyebrow}
        </div>
        <h2 className="cap-statement-title" id="cases-title" style={{ textAlign: "left", fontSize: "clamp(26px, 3.2vw, 36px)", lineHeight: 1, maxWidth: 420, marginBottom: "0.6rem" }}>
          Where it is being tested
        </h2>
        <p className="cap-statement-lead" style={{ textAlign: "left", fontSize: "0.78rem", lineHeight: 1.6, maxWidth: 520, marginTop: 0 }}>{cases.lead}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: "0.9rem", flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "DM Mono, monospace", fontSize: "0.58rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink4)", background: "var(--off)", border: "1px solid var(--rule)", padding: "4px 8px", borderRadius: 999 }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: "#ef4444" }} /> 4 patterns</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "DM Mono, monospace", fontSize: "0.58rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink4)", background: "var(--off)", border: "1px solid var(--rule)", padding: "4px 8px", borderRadius: 999 }}>Solo → Fleet</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "DM Mono, monospace", fontSize: "0.58rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink4)", background: "var(--off)", border: "1px solid var(--rule)", padding: "4px 8px", borderRadius: 999 }}>Live proof</span>
        </div>
      </div>

      <div className="cs-grid" ref={rowRef}>
        {cases.cards.map((card, i) => {
          const tags = card.signals.filter((s) => s !== "per-client policies" && s !== "every denial logged").slice(0, 2);
          return (
          <article className="cs-card" key={card.id}>
            <div className="cs-top">
              <span className="cs-num" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="cs-file">{card.file}</span>
            </div>
            <h3 className="cs-title">{card.title}</h3>
            <p className="cs-role">{card.role}</p>
            <div className="cs-block cs-block--problem">
              <span className="cs-label">the problem</span>
              <p className="cs-text">{card.stages[0].text}</p>
            </div>
            <div className="cs-block cs-block--fence">
              <span className="cs-label">what the fence did</span>
              <p className="cs-text">{card.stages[1].text}</p>
            </div>
            {tags.length > 0 && (
              <div className="cs-tags">
                {tags.map((sig) => (
                  <span className="cs-tag" key={sig}>
                    <ArrowUpRight size={11} strokeWidth={1.8} aria-hidden="true" />
                    {sig}
                  </span>
                ))}
              </div>
            )}
          </article>
          );
        })}
      </div>

      <div className="pc-progress" aria-hidden="true">
        <div className="pc-progress-meta">
          <span>case files</span>
          <span className="pc-progress-count">
            <span className="pc-progress-index">01</span> / 04
          </span>
        </div>
        <div className="pc-progress-rail">
          <span className="pc-progress-fill" />
          <span className="pc-progress-head" />
          <span className="pc-progress-tick" />
          <span className="pc-progress-tick" />
          <span className="pc-progress-tick" />
          <span className="pc-progress-tick" />
        </div>
      </div>

      <p className="cases-footnote">{cases.footnote}</p>
    </section>
  );
}
