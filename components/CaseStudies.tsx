"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motionAllowed } from "@/lib/anim";
import { cases } from "@/content/copy";

gsap.registerPlugin(ScrollTrigger);

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
                { opacity: 0, y: 16 },
                { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" },
                i * 0.22 + 0.08 + k * 0.04
              );
            });
        });
      } else {
        gsap.fromTo(
          cards,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.09,
            ease: "power2.out",
            scrollTrigger: { trigger: row, start: "top 88%" },
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
    <section className="section case-files" id="cases" aria-labelledby="cases-title">
      <div className="case-files-intro">
        <div className="section-eyebrow">{cases.eyebrow}</div>
        <h2 className="cap-statement-title" id="cases-title">
          {cases.title}
        </h2>
        <p className="cap-statement-lead">{cases.lead}</p>
      </div>

      <div className="pc-row" ref={rowRef}>
        {cases.cards.map((card, i) => (
          <article className="pc-card" key={card.id}>
            <div className="pc-inner">
              <span className="pc-num" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="pc-top">
                <span className="pc-badge">{String(i + 1).padStart(2, "0")}</span>
                <span className="pc-file">file · {card.file}</span>
                <span className="pc-status">
                  <span className="pc-status-dot" aria-hidden="true" />
                  {card.status}
                </span>
              </div>
              <h3 className="pc-title">{card.title}</h3>
              <p className="pc-role">{card.role}</p>
              <div className="pc-stages">
                {card.stages.map((s) => (
                  <div className={`pc-stage pc-stage--${s.tone}`} key={s.label}>
                    <span className="pc-stage-dot" aria-hidden="true" />
                    <div className="pc-stage-copy">
                      <span className="pc-stage-label">{s.label}</span>
                      <p className="pc-stage-text">{s.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pc-signals">
                {card.signals.map((sig) => (
                  <span className="pc-signal" key={sig}>
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
