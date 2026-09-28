"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { terms } from "@/content/copy";
import { Reveal } from "@/components/Reveal";
import SignatureDraw from "@/components/SignatureDraw";
import { adityaSignature, saniyaSignature } from "@/components/signaturePaths";

gsap.registerPlugin(ScrollTrigger);

const ADS = [
  { head: "If the fence says no, it means no.", body: "Blocked calls get logged with a reason. The audit trail is append-only, local, and yours.", cta: "Read the field notes", href: "/evidence", solid: false },
  { head: "Local by default. Cloud by accident only.", body: "Zero telemetry in the default configuration. Nothing leaves the machine unless you say so.", cta: "Check the checksums", href: "/downloads", solid: true },
  { head: "The penny press of agent policy.", body: "Schema checks in under ten milliseconds. Small print, set in lead, set once.", cta: "See the docs", href: "/evidence", solid: false },
];

export default function TermsEdition() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const ids = terms.sections.map((s) => s.h.toLowerCase().replace(/[^a-z0-9]+/g, "-"));

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from(".terms-hero h1 .word", { y: "110%", duration: 0.8, stagger: 0.05, ease: "expo.out", scrollTrigger: { trigger: ".terms-hero", start: "top 85%", once: true } });
      // rise-only motion, no opacity fade. clearProps scoped to transform
      // only — never "all", which would wipe React's inline card styles.
      // the interstitial ad cards share .legal-block so the column moves
      // as one.
      gsap.from(".terms-blocks .legal-block", { y: 20, duration: 0.6, stagger: 0.04, ease: "power3.out", clearProps: "transform", scrollTrigger: { trigger: ".terms-blocks", start: "top 85%", once: true } });
    }, root);
    const obs = ids.map((id, i) => ScrollTrigger.create({ trigger: document.getElementById(id)!, start: "top 55%", onEnter: () => setActive(i), onEnterBack: () => setActive(i) }));
    return () => { ctx.revert(); obs.forEach((o) => o?.kill()); };
  }, [ids]);

  return (
    <div ref={rootRef} style={{ maxWidth: 1140, margin: "0 auto", padding: "32px 2rem 80px" }}>
      <Reveal>
      <div className="terms-hero" style={{ paddingBottom: 8, marginBottom: 24 }}>
        <div style={{ fontFamily: "DM Mono, monospace", fontSize: "0.58rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--ink4)", marginBottom: 12 }}>{terms.eyebrow} — contract corner · August 16, 2026</div>
        <h1 style={{ fontFamily: "Fraunces, serif", fontWeight: 200, fontSize: "clamp(2.4rem, 5vw, 3.8rem)", lineHeight: 1.05, letterSpacing: "-0.04em", color: "var(--ink)", margin: 0, overflow: "hidden" }}>
          {terms.title.split(" ").map((w, i) => <span key={i} style={{ display: "inline-block", overflow: "hidden", paddingBottom: "0.06em", marginRight: "0.2em" }}><span className="word" style={{ display: "inline-block" }}>{w}</span></span>)}
        </h1>
        <p style={{ fontFamily: "DM Mono, monospace", fontWeight: 300, fontSize: "0.82rem", lineHeight: 1.8, color: "var(--ink3)", maxWidth: 640, marginTop: 14 }}>{terms.sub}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18, padding: "12px 16px", border: "1px solid var(--rule)", borderRadius: 6, background: "var(--off)", maxWidth: 480 }}>
          <span style={{ fontFamily: "DM Mono, monospace", fontSize: "0.62rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink)", fontWeight: 400 }}>50¢</span>
          <span style={{ width: 1, height: 14, background: "var(--rule)" }} />
          <span style={{ fontFamily: "DM Mono, monospace", fontSize: "0.62rem", color: "var(--ink4)" }}>{terms.sections.length} clauses · 0 warranties · local edition</span>
          <span style={{ marginLeft: "auto", fontFamily: "DM Mono, monospace", fontSize: "0.62rem", color: "var(--ink4)" }}>{terms.updated}</span>
        </div>
      </div>
      </Reveal>

      <div className="terms-layout">
        <div className="terms-side">
          <div style={{ fontFamily: "DM Mono, monospace", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink4)", marginBottom: 14 }}>Clauses</div>
          {terms.sections.map((s, i) => (
            <a key={s.h} href={`#${ids[i]}`} onClick={(e) => { e.preventDefault(); document.getElementById(ids[i])?.scrollIntoView({ behavior: "smooth" }); }} style={{ display: "block", padding: "7px 0 7px 12px", borderLeft: `2px solid ${active === i ? "#ef4444" : "var(--rule)"}`, fontFamily: "DM Mono, monospace", fontSize: "0.62rem", color: active === i ? "var(--ink)" : "var(--ink4)", textDecoration: "none", lineHeight: 1.4 }}>{String(i + 1).padStart(2, "0")} — {s.h}</a>
          ))}
          <div style={{ marginTop: 20, padding: "14px 16px", border: "1px solid var(--rule)", borderRadius: 6, background: "var(--white)" }}>
            <div style={{ fontFamily: "Fraunces, serif", fontWeight: 200, fontSize: "0.95rem", color: "var(--ink)", marginBottom: 6 }}>In witness whereof</div>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: "0.62rem", color: "var(--ink4)", lineHeight: 1.6 }}>Printed Aug 22, 2026</div>
          </div>
        </div>

        <div className="terms-blocks" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {terms.sections.map((s, i) => (
            <Fragment key={s.h}>
              <div id={ids[i]} className="legal-block" style={{ border: "1px solid var(--rule)", borderRadius: 8, padding: "1.6rem 1.8rem", background: "var(--white)" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
                  <span style={{ fontFamily: "DM Mono, monospace", fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink4)", border: "1px solid var(--rule)", padding: "2px 7px", borderRadius: 999 }}>§ {String(i + 1).padStart(2, "0")}</span>
                  <h2 style={{ fontFamily: "Fraunces, serif", fontWeight: 200, fontSize: "1.2rem", color: "var(--ink)", margin: 0 }}>{s.h}</h2>
                </div>
                <p style={{ fontFamily: "DM Mono, monospace", fontWeight: 300, fontSize: "0.76rem", lineHeight: 1.8, color: "var(--ink3)", margin: 0 }}>{s.legal}</p>
                <div style={{ marginTop: 12, padding: "12px 14px", borderLeft: "2px solid #ef4444", background: "var(--off)", borderRadius: "0 6px 6px 0" }}>
                  <div style={{ fontFamily: "DM Mono, monospace", fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink4)", marginBottom: 6 }}>{terms.modeLabel.plain}</div>
                  <p style={{ fontFamily: "DM Mono, monospace", fontWeight: 300, fontSize: "0.74rem", lineHeight: 1.7, color: "var(--ink3)", margin: 0 }}>{s.plain}</p>
                </div>
              </div>
              {i === 1 && <div className="legal-block" style={{ border: "1px solid var(--rule)", borderRadius: 8, padding: "1.4rem 1.6rem", background: "var(--white)" }}><div style={{ fontFamily: "Fraunces, serif", fontWeight: 200, fontSize: "1.15rem", color: "var(--ink)", marginBottom: 6 }}>{ADS[0].head}</div><p style={{ fontFamily: "DM Mono, monospace", fontWeight: 300, fontSize: "0.74rem", color: "var(--ink3)", margin: 0 }}>{ADS[0].body}</p><a href={ADS[0].href} style={{ fontFamily: "DM Mono, monospace", fontSize: "0.62rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink)", textDecoration: "none", display: "inline-flex", gap: 6, marginTop: 10 }}>{ADS[0].cta} →</a></div>}
              {/* solid card stays always-dark in both themes — var(--ink) flips
                  to near-white in dark mode, which made the light body text
                  invisible. fixed hexes keep the inverted-slab intent. */}
              {i === 6 && <div className="legal-block" style={{ border: "1px solid var(--rule)", borderRadius: 8, padding: "1.4rem 1.6rem", background: "#1a1a18", color: "#fafaf8" }}><div style={{ fontFamily: "Fraunces, serif", fontWeight: 200, fontSize: "1.15rem", color: "#fafaf8", marginBottom: 6 }}>{ADS[1].head}</div><p style={{ fontFamily: "DM Mono, monospace", fontWeight: 300, fontSize: "0.74rem", color: "rgba(250,250,248,0.72)", margin: 0 }}>{ADS[1].body}</p><a href={ADS[1].href} style={{ fontFamily: "DM Mono, monospace", fontSize: "0.62rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "#fafaf8", textDecoration: "none", display: "inline-flex", gap: 6, marginTop: 10 }}>{ADS[1].cta} →</a></div>}
              {i === 10 && <div className="legal-block" style={{ border: "1px solid var(--rule)", borderRadius: 8, padding: "1.4rem 1.6rem", background: "var(--off)" }}><div style={{ fontFamily: "Fraunces, serif", fontWeight: 200, fontSize: "1.15rem", color: "var(--ink)", marginBottom: 6 }}>{ADS[2].head}</div><p style={{ fontFamily: "DM Mono, monospace", fontWeight: 300, fontSize: "0.74rem", color: "var(--ink3)", margin: 0 }}>{ADS[2].body}</p></div>}
            </Fragment>
          ))}

          <div style={{ paddingTop: 32, textAlign: "center", marginTop: 8 }}>
            <div style={{ width: "58%", height: 1, background: "var(--ink)", margin: "0 auto 24px", opacity: 0.12 }} />
            <p style={{ fontFamily: "DM Mono, monospace", fontSize: "0.62rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink4)", maxWidth: "46ch", margin: "0 auto", lineHeight: 1.8 }}>In witness whereof, the parties have caused these terms to be printed in the Sunday edition of The Context Fence, August 22, 2026.</p>
            <div style={{ display: "flex", justifyContent: "space-evenly", gap: 24, marginTop: 32, flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 230 }}><SignatureDraw label="Aditya" viewBox={adityaSignature.viewBox} paths={adityaSignature.paths} /><div style={{ width: 230, height: 1, background: "var(--ink)", margin: "10px 0 8px", opacity: 0.18 }} /><span style={{ fontFamily: "DM Mono, monospace", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink4)" }}>Aditya — founder</span></div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 230 }}><SignatureDraw label="Saniya" viewBox={saniyaSignature.viewBox} paths={saniyaSignature.paths} /><div style={{ width: 230, height: 1, background: "var(--ink)", margin: "10px 0 8px", opacity: 0.18 }} /><span style={{ fontFamily: "DM Mono, monospace", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink4)" }}>Saniya — co-founder</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
