"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BreathingText from "@/components/fancy/text/breathing-text";
import GradientWaves from "@/components/GradientWaves";
import { Reveal } from "@/components/Reveal";
import { hero } from "@/content/copy";

export default function Hero() {
  // Foldables + phones get the light shader (40 raymarch steps, no grain).
  // Desktop keeps the full-quality backdrop. Same look, fraction of the GPU.
  const [liteWaves, setLiteWaves] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setLiteWaves(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return (
    <section
      id="hero-top"
      style={{
        position: "relative",
        minHeight: "calc(100svh - 64px)",
        display: "grid",
        placeItems: "center",
        textAlign: "center",
        padding: "4rem 2rem 3rem",
        background: "var(--white)",
        overflow: "hidden",
        isolation: "isolate",
      }}
    >
      <div style={{ position: "absolute", inset: 0, opacity: 0.45 }}>
        <GradientWaves
          horizonColor="#fffaf8"
          waveColor="#ffe9e5"
          crestColor="#ffd8d0"
          speed={0.08}
          amplitude={2.2}
          waveScale={0.55}
          waveRatio={0.6}
          swell={12}
          turbulence={6}
          tilt={0.9}
          zoom={1.15}
          height={4.5}
          fogDepth={22}
          detail={liteWaves ? "low" : "medium"}
          brightness={1.02}
          opacity={0.9}
          mouseInteraction={false}
          parallaxStrength={0}
          grain={!liteWaves}
          grainIntensity={0.015}
        />
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "linear-gradient(var(--rule) 1px, transparent 1px), linear-gradient(90deg, var(--rule) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.06,
          maskImage: "radial-gradient(70% 60% at 50% 30%, black 35%, transparent 78%)",
          WebkitMaskImage: "radial-gradient(70% 60% at 50% 30%, black 35%, transparent 78%)",
          pointerEvents: "none",
        }}
        aria-hidden="true"
      />
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(70% 50% at 50% 15%, transparent 0%, var(--white) 72%)", pointerEvents: "none" }} />

      <Reveal>
      <div style={{ position: "relative", zIndex: 1, maxWidth: 760, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.9rem" }}>
        <BreathingText
          as="h1"
          fromFontVariationSettings="'wght' 300, 'opsz' 9"
          toFontVariationSettings="'wght' 700, 'opsz' 144"
          staggerDuration={0.035}
          staggerFrom="center"
          transition={{ duration: 2.4, ease: "easeInOut" }}
          repeatDelay={0.3}
          style={{
            fontFamily: "Fraunces, serif",
            fontSize: "clamp(3.6rem, 9vw, 6.8rem)",
            letterSpacing: "-0.05em",
            lineHeight: 0.9,
            color: "#ef4444",
            margin: 0,
            fontVariationSettings: "'wght' 300, 'opsz' 9",
          }}
        >
          Context Fence
        </BreathingText>

        <p
          style={{
            fontFamily: "DM Mono, monospace",
            fontWeight: 300,
            fontSize: "0.72rem",
            lineHeight: 1.6,
            color: "var(--ink3)",
            opacity: 0.65,
            maxWidth: 480,
            margin: "0.2rem 0 0",
          }}
        >
          Stop your AI agent from leaking your secrets.
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "0.6rem", flexWrap: "wrap", justifyContent: "center" }}>
          <Link
            href={hero.primaryCta.href}
            style={{
              fontFamily: "DM Mono, monospace",
              fontSize: "0.68rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              background: "#ef4444",
              color: "white",
              padding: "0.85rem 1.6rem",
              borderRadius: 999,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 8px 24px rgba(239,68,68,0.22)",
              border: "1px solid #ef4444",
            }}
          >
            {hero.primaryCta.label} <span>→</span>
          </Link>
        </div>
      </div>
      </Reveal>
    </section>
  );
}
