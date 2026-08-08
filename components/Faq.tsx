"use client";

import { useRef, useState } from "react";
import { animate } from "animejs";
import { faq } from "@/content/copy";
import { faqSchema } from "@/lib/seo";
import { motionAllowed } from "@/lib/anim";

// accordion: anime.js for the height + chevron rotate.
// one isolated transform is all the GSAP budget this section needs.
export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const chevRefs = useRef<(SVGSVGElement | null)[]>([]);

  function toggle(i: number) {
    const next = openIndex === i ? null : i;
    const panel = panelRefs.current[i];
    const chev = chevRefs.current[i];

    if (motionAllowed() && panel && chev) {
      const target = next === i ? panel.scrollHeight : 0;
      animate(panel, {
        height: [panel.offsetHeight, target],
        duration: 260,
        easing: "easeOutQuad",
        complete() {
          // let the panel breathe once open; zero stays zero when closed
          if (next === i) panel.style.height = "auto";
        },
      });
      animate(chev, {
        rotate: next === i ? [0, 180] : [180, 0],
        duration: 200,
        easing: "easeOutQuad",
      });
    } else if (panel) {
      panel.style.height = next === i ? "auto" : "0px";
    }

    setOpenIndex(next);
  }

  const jsonLd = faqSchema(faq.items);

  return (
    <section className="section tight" id="faq" aria-labelledby="faq-title">
      <div className="section-eyebrow">{faq.eyebrow}</div>
      <h2 className="section-title" id="faq-title">{faq.title}</h2>
      <div className="faq-list" style={{ marginTop: 40 }}>
        {faq.items.map((item, i) => {
          const open = openIndex === i;
          return (
            <div className="faq-item" key={item.q}>
              <h3 style={{ margin: 0 }}>
                <button
                  type="button"
                  className="faq-q"
                  aria-expanded={open}
                  aria-controls={`faq-panel-${i}`}
                  id={`faq-q-${i}`}
                  onClick={() => toggle(i)}
                >
                  {item.q}
                  <svg
                    ref={(el) => { chevRefs.current[i] = el; }}
                    className="faq-chevron"
                    viewBox="0 0 14 14"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
                  </svg>
                </button>
              </h3>
              <div
                ref={(el) => { panelRefs.current[i] = el; }}
                className="faq-a"
                id={`faq-panel-${i}`}
                role="region"
                aria-labelledby={`faq-q-${i}`}
                style={{ height: open ? "auto" : "0px" }}
              >
                <div className="faq-a-inner">{item.a}</div>
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