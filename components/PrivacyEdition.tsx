"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Reveal } from "@/components/Reveal";
import { privacy } from "@/content/copy";

gsap.registerPlugin(ScrollTrigger);

export default function PrivacyEdition() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const sections = [
    { id: "who", label: privacy.who.h },
    ...privacy.sections.map((s) => ({ id: s.h.toLowerCase().replace(/[^a-z0-9]+/g, "-"), label: s.h })),
    { id: "flow", label: privacy.flow.h },
    { id: "contact", label: privacy.contact.h },
  ];

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from(root.querySelectorAll(".legal-block"), { y: 24, duration: 0.6, stagger: 0.06, ease: "power3.out", clearProps: "transform", scrollTrigger: { trigger: root, start: "top 82%", once: true } });
      gsap.from(".legal-hero h1 .word", { y: "110%", duration: 0.8, stagger: 0.06, ease: "expo.out", scrollTrigger: { trigger: ".legal-hero", start: "top 85%", once: true } });
    }, root);
    const obs = sections.map((_, i) => {
      const el = document.getElementById(sections[i].id);
      if (!el) return null;
      return ScrollTrigger.create({
        trigger: el,
        start: "top 50%",
        end: "bottom 50%",
        onEnter: () => setActive(i),
        onEnterBack: () => setActive(i),
      });
    });
    return () => { ctx.revert(); obs.forEach((o) => o?.kill()); };
  }, []);

  return (
    <div ref={rootRef} style={{ maxWidth: 1140, margin: "0 auto", padding: "32px 2rem 80px" }}>
      <Reveal>
      <div className="legal-hero" style={{ paddingBottom: 8, marginBottom: 24 }}>
        <div style={{ fontFamily: "DM Mono, monospace", fontSize: "0.58rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#ef4444", marginBottom: 14, fontWeight: 600 }}>— confidential — do not redact · August 16, 2026</div>
        <h1 style={{ fontFamily: "Fraunces, serif", fontWeight: 200, fontSize: "clamp(2.4rem, 5vw, 3.8rem)", lineHeight: 1.05, letterSpacing: "-0.04em", color: "var(--ink)", margin: 0, overflow: "hidden" }}>
          {privacy.title.split(" ").map((w, i) => (
            <span key={i} style={{ display: "inline-block", overflow: "hidden", paddingBottom: "0.06em", marginRight: "0.2em" }}><span className="word" style={{ display: "inline-block" }}>{w}</span></span>
          ))}
        </h1>
        <p style={{ fontFamily: "DM Mono, monospace", fontWeight: 300, fontSize: "0.82rem", lineHeight: 1.8, color: "var(--ink3)", maxWidth: 640, marginTop: 16 }}>{privacy.sub}</p>
        <p style={{ fontFamily: "DM Mono, monospace", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink4)", marginTop: 16 }}>{privacy.updated}</p>
      </div>
      </Reveal>

      {/* TLDR band — renders only when items exist */}
      {privacy.tldr.length > 0 && (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12, marginBottom: 32 }}>
        {privacy.tldr.map((t) => (
          <div key={t} style={{ border: "1px solid var(--rule)", borderRadius: 12, padding: "14px 16px", background: "var(--white)", fontFamily: "DM Mono, monospace", fontSize: "0.62rem", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink2)", lineHeight: 1.6, borderLeft: "2px solid #ef4444" }}>{t}</div>
        ))}
      </div>
      )}

      <div className="privacy-layout">
        {/* Sticky TOC */}
        <div className="privacy-side">
          <div style={{ fontFamily: "DM Mono, monospace", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink4)", marginBottom: 16 }}>Contents</div>
          {sections.map((s, i) => (
            <a key={s.id} href={`#${s.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }} style={{ display: "block", padding: "8px 0 8px 14px", borderLeft: `2px solid ${active === i ? "#ef4444" : "var(--rule)"}`, fontFamily: "DM Mono, monospace", fontSize: "0.62rem", letterSpacing: "0.04em", color: active === i ? "var(--ink)" : "var(--ink4)", textDecoration: "none", transition: "border-color 0.2s, color 0.2s" }}>{String(i).padStart(2, "0")} — {s.label}</a>
          ))}
        </div>

        {/* Content */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div id="who" className="legal-block" style={{ border: "1px solid var(--rule)", borderRadius: 8, padding: "1.8rem 2rem", background: "var(--white)" }}>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink4)", marginBottom: 8 }}>§ 00 — {privacy.who.h}</div>
            <h2 style={{ fontFamily: "Fraunces, serif", fontWeight: 200, fontSize: "1.35rem", letterSpacing: "-0.02em", color: "var(--ink)", margin: "0 0 10px" }}>{privacy.who.h}</h2>
            <p style={{ fontFamily: "DM Mono, monospace", fontWeight: 300, fontSize: "0.78rem", lineHeight: 1.8, color: "var(--ink3)", margin: 0 }}>{privacy.who.p}</p>
          </div>
          {privacy.sections.map((s, i) => (
            <div key={s.h} id={s.h.toLowerCase().replace(/[^a-z0-9]+/g, "-")} className="legal-block" style={{ border: "1px solid var(--rule)", borderRadius: 8, padding: "1.8rem 2rem", background: i % 2 === 0 ? "var(--white)" : "var(--off)" }}>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink4)", marginBottom: 8 }}>§ {String(i + 1).padStart(2, "0")}</div>
              <h2 style={{ fontFamily: "Fraunces, serif", fontWeight: 200, fontSize: "1.25rem", color: "var(--ink)", margin: "0 0 10px" }}>{s.h}</h2>
              {s.p && <p style={{ fontFamily: "DM Mono, monospace", fontWeight: 300, fontSize: "0.78rem", lineHeight: 1.8, color: "var(--ink3)", margin: 0 }}>{s.p}</p>}
              {s.items && <ul style={{ margin: "12px 0 0", padding: 0, listStyle: "none" }}>{s.items.map((it) => <li key={it} style={{ fontFamily: "DM Mono, monospace", fontWeight: 300, fontSize: "0.75rem", lineHeight: 1.7, color: "var(--ink3)", padding: "5px 0", display: "flex", gap: 8 }}><span style={{ color: "var(--ink)" }}>—</span><span>{it}</span></li>)}</ul>}
            </div>
          ))}
          {/* flow card stays always-dark in both themes — var(--ink) flips to
              near-white in dark mode, which made the light text invisible. */}
          <div id="flow" className="legal-block" style={{ border: "1px solid var(--rule)", borderRadius: 8, padding: "1.8rem 2rem", background: "#1a1a18", color: "#fafaf8" }}>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(250,250,248,0.6)", marginBottom: 8 }}>§ flow — {privacy.flow.h}</div>
            <h2 style={{ fontFamily: "Fraunces, serif", fontWeight: 200, fontSize: "1.35rem", color: "#fafaf8", margin: "0 0 8px" }}>{privacy.flow.h}</h2>
            <p style={{ fontFamily: "DM Mono, monospace", fontWeight: 300, fontSize: "0.78rem", lineHeight: 1.7, color: "rgba(250,250,248,0.75)", margin: 0 }}>{privacy.flow.p}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12, marginTop: 18 }}>
              {privacy.flow.modes.map((m, i) => (
                <div key={m.id} style={{ border: "1px solid rgba(250,250,248,0.15)", borderRadius: 6, padding: "14px 16px", background: "rgba(250,250,248,0.04)" }}>
                  <div style={{ fontFamily: "DM Mono, monospace", fontSize: "1.4rem", fontWeight: 300, color: "rgba(250,250,248,0.18)", lineHeight: 1 }}>0{i + 1}</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#fafaf8", marginTop: 8 }}>{m.label}</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontWeight: 300, fontSize: "0.68rem", lineHeight: 1.6, color: "rgba(250,250,248,0.7)", marginTop: 6 }}>{m.note}</div>
                </div>
              ))}
            </div>
          </div>
          <div id="contact" className="legal-block" style={{ border: "1px solid var(--rule)", borderRadius: 8, padding: "1.8rem 2rem", background: "var(--off)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <h2 style={{ fontFamily: "Fraunces, serif", fontWeight: 200, fontSize: "1.25rem", color: "var(--ink)", margin: 0 }}>{privacy.contact.h}</h2>
              <p style={{ fontFamily: "DM Mono, monospace", fontWeight: 300, fontSize: "0.78rem", color: "var(--ink3)", margin: "6px 0 0", maxWidth: 520 }}>{privacy.contact.p}</p>
            </div>
            <Link href={privacy.contact.cta.href} style={{ fontFamily: "DM Mono, monospace", fontSize: "0.62rem", letterSpacing: "0.08em", textTransform: "uppercase", background: "#ef4444", color: "white", padding: "0.7rem 1.4rem", borderRadius: 999, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(239,68,68,0.22)" }}>{privacy.contact.cta.label} <span>→</span></Link>
          </div>
          <div style={{ textAlign: "center", padding: "24px 0", marginTop: 8, fontFamily: "DM Mono, monospace", fontSize: "0.58rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink4)", lineHeight: 1.8, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} /> This ledger first ran August 16, 2026 · The Privacy Ledger edition · subject to revision</div>
        </div>
      </div>
    </div>
  );
}
