"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ScrollReveal from "@/components/ScrollReveal";
import { problem } from "@/content/copy";
import { motionAllowed } from "@/lib/anim";

gsap.registerPlugin(ScrollTrigger);

export default function Problem() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!motionAllowed()) return;
    const root = rootRef.current;
    if (!root) return;
    const ctx = gsap.context(() => {
      gsap.from(".problem-left h2 .word", {
        y: "110%",
        duration: 0.8,
        stagger: 0.05,
        ease: "expo.out",
        scrollTrigger: { trigger: ".problem-left", start: "top 82%", once: true },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={rootRef} id="why" aria-labelledby="why-title" style={{ maxWidth: 1140, margin: "0 auto", padding: "0 2rem 4rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 5fr) minmax(0, 7fr)", gap: "clamp(48px, 8vw, 120px)", alignItems: "start", paddingTop: "clamp(40px, 6vw, 88px)", borderTop: "1px solid var(--rule)" }} className="problem-grid">
        {/* Left sticky — match // capabilities column */}
        <div className="problem-left" style={{ position: "sticky", top: "120px", paddingRight: "1rem" }}>
          <div style={{ fontFamily: "DM Mono, monospace", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#ef4444", marginBottom: "14px", fontWeight: 600 }}>Why this exists</div>
          <h2 id="why-title" style={{ fontFamily: "Fraunces, serif", fontWeight: 200, fontSize: "clamp(2rem, 4vw, 2.8rem)", lineHeight: 1.05, letterSpacing: "-0.03em", color: "var(--ink)", margin: 0, textAlign: "left" }}>
            Your agent doesn&apos;t ask — <span style={{ color: "#ef4444", fontStyle: "italic" }}>it just reads.</span>
          </h2>
          <p style={{ fontFamily: "DM Mono, monospace", fontWeight: 300, fontSize: "0.72rem", lineHeight: 1.7, color: "var(--ink3)", marginTop: "0.8rem", maxWidth: 360 }}>
            An agent will open the file you never wanted it to touch. We put a local check in that gap — every call validated before it runs, at schema speed.
          </p>
        </div>

        {/* Right scroll — single narrative text, only red highlights */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <ScrollReveal baseOpacity={0.12} baseRotation={2.5} containerClassName="why-narrative-reveal" textClassName="why-narrative-text" rotationEnd="top 60%" wordAnimationEnd="bottom 55%">
            {[
              ...problem.narrative.map((seg) => ({ text: seg.text, className: seg.hl ? "hl hl--incident" : undefined })),
              { text: " Most teams just trust the agent. The fence checks first." },
            ]}
          </ScrollReveal>
        </div>
      </div>
      <style>{`@media (max-width: 860px) { .problem-grid { grid-template-columns: 1fr !important; } .problem-left { position: relative !important; top: 0 !important; } }`}</style>
    </section>
  );
}
