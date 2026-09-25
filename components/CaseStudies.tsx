"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motionAllowed } from "@/lib/anim";
import { cases } from "@/content/copy";
import { AlertTriangle, Shield, Sparkles, ArrowUpRight } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const toneIcon: Record<string, typeof AlertTriangle> = {
  problem: AlertTriangle,
  fence: Shield,
  finding: Sparkles,
};

export default function CaseStudies() {
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    if (!motionAllowed()) return;
    const section = row.closest<HTMLElement>("section");
    const cards = row.querySelectorAll<HTMLElement>(".pc-card");
    if (!section || cards.length === 0) return;

    const fill = section.querySelector<HTMLElement>(".pc-progress-fill");
    const head = section.querySelector<HTMLElement>(".pc-progress-head");
    const indexEl = section.querySelector<HTMLElement>(".pc-progress-index");
    const ticks = section.querySelectorAll<HTMLElement>(".pc-progress-tick");

    const ctx = gsap.context(() => {
      if (window.matchMedia("(min-width: 1024px)").matches) {
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
            { scaleX: 0.08, transformOrigin: "left center" },
            { scaleX: 1, transformOrigin: "left center", duration: 0.35, ease: "power2.inOut" },
            i * 0.22
          );
          card
            .querySelectorAll<HTMLElement>(".pc-num, .pc-top, .pc-title, .pc-role, .pc-stages, .pc-signals")
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
        <div className="section-eyebrow" style={{ textAlign: "left", display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
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

      <div className="pc-row" ref={rowRef}>
        {cases.cards.map((card, i) => (
          <article className="pc-card" key={card.id} style={{ display: "flex", flexDirection: "column" }}>
            <div className="pc-inner">
              <span className="pc-num" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="pc-top">
                <span className="pc-badge">{String(i + 1).padStart(2, "0")}</span>
                <span className="pc-status">
                  <span className="pc-status-dot" aria-hidden="true" />
                  {card.status}
                </span>
              </div>
              <h3 className="pc-title">{card.title}</h3>
              <p className="pc-role">{card.role}</p>
              <div className="pc-stages" style={{ gap: 10 }}>
                {card.stages.slice(0, 2).map((s) => {
                  const Icon = toneIcon[s.tone] || AlertTriangle;
                  return (
                    <div className={`pc-stage pc-stage--${s.tone}`} key={s.label} style={{ padding: "10px 0", gap: 10 }}>
                      <span
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: "50%",
                          display: "grid",
                          placeItems: "center",
                          flexShrink: 0,
                          background: s.tone === "problem" ? "rgba(239,68,68,0.08)" : s.tone === "fence" ? "var(--off)" : "rgba(16,185,129,0.08)",
                          border: `1px solid ${s.tone === "problem" ? "rgba(239,68,68,0.18)" : s.tone === "finding" ? "rgba(16,185,129,0.18)" : "var(--rule)"}`,
                          color: s.tone === "problem" ? "#ef4444" : s.tone === "finding" ? "#10b981" : "var(--ink)",
                          marginTop: 1,
                        }}
                      >
                        <Icon size={12} strokeWidth={1.8} />
                      </span>
                      <div className="pc-stage-copy">
                        <span className="pc-stage-label" style={{ fontSize: "0.58rem", letterSpacing: "0.1em" }}>{s.label}</span>
                        <p className="pc-stage-text" style={{ fontSize: "0.78rem", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{s.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="pc-signals" style={{ gap: 6, paddingTop: 12 }}>
                {card.signals.slice(0, 2).map((sig) => (
                  <span className="pc-signal" key={sig} style={{ fontSize: "0.52rem", padding: "4px 8px", display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <ArrowUpRight size={10} strokeWidth={1.8} style={{ opacity: 0.5 }} />
                    {sig}
                  </span>
                ))}
              </div>
              <span className="pc-power" aria-hidden="true" />
            </div>
          </article>
        ))}
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
