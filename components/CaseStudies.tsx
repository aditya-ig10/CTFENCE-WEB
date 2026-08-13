"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motionAllowed } from "@/lib/anim";
import { cases } from "@/content/copy";

gsap.registerPlugin(ScrollTrigger);

export default function CaseStudies() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (!motionAllowed()) return;
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    if (!window.matchMedia("(min-height: 760px)").matches) return;

    const cards = track.querySelectorAll<HTMLElement>(".pc-card");
    const fill = track.querySelector<HTMLElement>(".pc-progress-fill");
    const head = track.querySelector<HTMLElement>(".pc-progress-head");
    const indexEl = track.querySelector<HTMLElement>(".pc-progress-index");
    const ticks = track.querySelectorAll<HTMLElement>(".pc-progress-tick");
    if (cards.length === 0) return;

    const html = document.documentElement;
    const onUpdate = (self: ScrollTrigger) => {
      const p = gsap.utils.clamp(0, 1, self.progress);
      if (fill) gsap.set(fill, { scaleX: p });
      if (head) gsap.set(head, { left: `${p * 100}%` });
      const seg = Math.min(3, Math.floor(p * 4));
      ticks.forEach((t, i) => t.classList.toggle("is-on", i <= seg));
      if (indexEl) indexEl.textContent = String(seg + 1).padStart(2, "0");
    };

    let ctx: gsap.Context | null = null;

    const build = () => {
      ctx?.revert();
      ctx = gsap.context(() => {
        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: track,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.6,
            onUpdate,
          },
        });
        cards.forEach((card, i) => {
          const innerEls = card.querySelectorAll(
            ".pc-num, .pc-top, .pc-title, .pc-role, .pc-stages, .pc-signals"
          );
          timeline.fromTo(
            card,
            { scaleX: 0.08, transformOrigin: "left center" },
            { scaleX: 1, transformOrigin: "left center", duration: 0.3, ease: "power2.inOut" },
            i * 0.34
          );
          innerEls.forEach((el, k) => {
            timeline.fromTo(
              el,
              { opacity: 0, y: 16 },
              { opacity: 1, y: 0, duration: 0.35, ease: "power2.out" },
              i * 0.34 + 0.1 + k * 0.045
            );
          });
        });
      }, track);
    };

    const setHeight = () => {
      track.style.height = `${window.innerHeight * 2.6}px`;
    };

    setHeight();
    html.classList.add("pc-enable");
    build();

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        setHeight();
        build();
        ScrollTrigger.refresh();
      }, 120);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
      ctx?.revert();
      html.classList.remove("pc-enable");
      track.style.height = "";
    };
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

      <div className="pc-track" ref={trackRef}>
        <div className="pc-view">
          <div className="pc-row">
            {cases.cards.map((card, i) => (
              <div className="pc-wrap" key={card.id}>
                <article className="pc-card" style={{ "--pc-i": i } as CSSProperties}>
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
              </div>
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
        </div>
      </div>

      <p className="cases-footnote">{cases.footnote}</p>
    </section>
  );
}