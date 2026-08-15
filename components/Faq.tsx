"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { faq } from "@/content/copy";
import { faqSchema } from "@/lib/seo";
import { motionAllowed } from "@/lib/anim";

// an editorial index accordion: mono numerals, serif questions,
// a plus that turns into a cross. every state change is one gsap
// tween — height, chevron, accent rule, answer drift, numeral pop.

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const innerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const chevRefs = useRef<(SVGSVGElement | null)[]>([]);
  const idxRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const ruleRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  function openPanel(i: number) {
    const panel = panelRefs.current[i];
    const inner = innerRefs.current[i];
    const chev = chevRefs.current[i];
    const idx = idxRefs.current[i];
    const rule = ruleRefs.current[i];
    if (!panel) return;

    if (motionAllowed()) {
      gsap.to(panel, {
        height: panel.scrollHeight,
        duration: 0.55,
        ease: "power3.inOut",
        onComplete() {
          panel.style.height = "auto";
        },
      });
      if (inner) {
        gsap.fromTo(
          inner,
          { y: 14, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.45, delay: 0.14, ease: "power2.out" }
        );
      }
      if (chev) {
        gsap.to(chev, { rotate: 45, duration: 0.5, ease: "back.out(1.8)" });
      }
      if (idx) {
        gsap.fromTo(
          idx,
          { scale: 0.55, autoAlpha: 0.3 },
          { scale: 1, autoAlpha: 1, duration: 0.45, ease: "back.out(2.4)" }
        );
      }
      if (rule) {
        gsap.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "power3.inOut" });
      }
    } else {
      panel.style.height = "auto";
      if (chev) chev.style.transform = "rotate(45deg)";
      if (rule) rule.style.transform = "scaleX(1)";
    }
  }

  function closePanel(i: number) {
    const panel = panelRefs.current[i];
    const inner = innerRefs.current[i];
    const chev = chevRefs.current[i];
    const rule = ruleRefs.current[i];
    if (!panel) return;

    if (motionAllowed()) {
      gsap.to(panel, { height: 0, duration: 0.5, ease: "power3.inOut" });
      if (inner) {
        gsap.to(inner, { autoAlpha: 0, duration: 0.18, ease: "power1.in" });
      }
      if (chev) {
        gsap.to(chev, { rotate: 0, duration: 0.4, ease: "power2.inOut" });
      }
      if (rule) {
        gsap.to(rule, { scaleX: 0, duration: 0.35, ease: "power2.in" });
      }
    } else {
      panel.style.height = "0px";
      if (chev) chev.style.transform = "rotate(0deg)";
      if (rule) rule.style.transform = "scaleX(0)";
    }
  }

  function toggle(i: number) {
    if (openIndex === i) {
      closePanel(i);
      setOpenIndex(null);
      return;
    }
    if (openIndex !== null) closePanel(openIndex);
    openPanel(i);
    setOpenIndex(i);
  }

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    if (!motionAllowed()) return;

    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>(".faq-item", list);

      // rows set in off the press, numerals + rules following behind
      gsap.fromTo(
        items,
        { y: 34, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.75,
          stagger: 0.09,
          ease: "power3.out",
          scrollTrigger: { trigger: list, start: "top 85%", once: true },
        }
      );
      gsap.fromTo(
        gsap.utils.toArray<HTMLElement>(".faq-idx", list),
        { autoAlpha: 0, x: -10 },
        {
          autoAlpha: 1,
          x: 0,
          duration: 0.5,
          stagger: 0.09,
          delay: 0.25,
          ease: "power2.out",
          scrollTrigger: { trigger: list, start: "top 85%", once: true },
        }
      );
    }, list);

    return () => ctx.revert();
  }, []);

  const jsonLd = faqSchema(faq.items);

  return (
    <section className="section tight faq" id="faq" aria-labelledby="faq-title">
      <div className="faq-rail">
        <div className="section-eyebrow">{faq.eyebrow}</div>
        <h2 className="section-title" id="faq-title">
          {faq.title}
        </h2>
        <p className="section-lead">{faq.lead}</p>
        <div className="faq-more">
          <span>{faq.more.text}</span>
          <Link className="faq-more-cta" href={faq.more.href}>
            {faq.more.cta}
            <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="faq-list" ref={listRef}>
        {faq.items.map((item, i) => {
          const open = openIndex === i;
          return (
            <div className={`faq-item${open ? " is-open" : ""}`} key={item.q}>
              <span className="faq-rule" ref={(el) => { ruleRefs.current[i] = el; }} aria-hidden="true" />
              <button
                type="button"
                className="faq-q"
                aria-expanded={open}
                aria-controls={`faq-panel-${i}`}
                id={`faq-q-${i}`}
                onClick={() => toggle(i)}
              >
                <span className="faq-idx" ref={(el) => { idxRefs.current[i] = el; }} aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="faq-txt">{item.q}</span>
                <svg
                  ref={(el) => { chevRefs.current[i] = el; }}
                  className="faq-chevron"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
                </svg>
              </button>
              <div
                ref={(el) => { panelRefs.current[i] = el; }}
                className="faq-a"
                id={`faq-panel-${i}`}
                role="region"
                aria-labelledby={`faq-q-${i}`}
                style={{ height: open ? "auto" : "0px" }}
              >
                <div className="faq-a-inner" ref={(el) => { innerRefs.current[i] = el; }}>
                  {item.a}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  );
}