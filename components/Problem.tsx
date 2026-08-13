"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitText from "@/components/SplitText";
import ScrollReveal from "@/components/ScrollReveal";
import { problem } from "@/content/copy";
import { motionAllowed } from "@/lib/anim";

gsap.registerPlugin(ScrollTrigger);

const ACT_COUNT = 3;

function KeyGlyph() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="8" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M11 12h8M16 12v3M19 12v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function LockGlyph() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function SceneCard({
  num,
  label,
  title,
  body,
  time,
  tone,
}: {
  num: string;
  label: string;
  title: string;
  body: string;
  time: string;
  tone: "incident" | "wrong" | "right";
}) {
  return (
    <article className={`replay-scene ${tone}`}>
      <div className="replay-scene-meta">
        <span className="replay-scene-time">{time}</span>
        <span className="replay-scene-num">{num}</span>
        <span className="replay-scene-label">{label}</span>
      </div>
      <h3 className="replay-scene-title">{title}</h3>
      <p className="replay-scene-body">{body}</p>
    </article>
  );
}

export default function Problem() {
  const narrativeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!motionAllowed()) return;
    const narrative = narrativeRef.current;
    if (!narrative) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: narrative,
        start: "top 72%",
        end: "bottom 50%",
        scrub: 0.6,
        onUpdate: (self) => {
          const p = self.progress;
          document.querySelectorAll<HTMLElement>(".replay-scene").forEach((card, i) => {
            const start = i / ACT_COUNT;
            const end = (i + 1) / ACT_COUNT;
            const last = i === ACT_COUNT - 1;
            card.classList.toggle("is-active", last ? p >= start : p >= start && p < end);
          });
        },
      });
    }, narrative);

    return () => ctx.revert();
  }, []);

  return (
    <section className="section tight" id="why" aria-labelledby="why-title">
      <div className="why-replay">
        <div className="section-eyebrow">{problem.eyebrow}</div>
        <h2 className="why-replay-title" id="why-title">
          <span>{problem.title[0]}</span>
          <br />
          <SplitText
            tag="span"
            text={problem.title[1]}
            className="why-replay-accent"
            delay={24}
            duration={0.7}
            ease="power3.out"
            splitType="chars"
            textAlign="center"
          />
        </h2>
        <p className="why-replay-lead">{problem.lead}</p>

        <div className="why-narrative" ref={narrativeRef}>
          <div className="why-doodle why-doodle-key" aria-hidden="true">
            <KeyGlyph />
          </div>
          <ScrollReveal
            enableBlur
            baseOpacity={0.12}
            baseRotation={2.5}
            blurStrength={8}
            containerClassName="why-narrative-reveal"
            textClassName="why-narrative-text"
            rotationEnd="top 60%"
            wordAnimationEnd="bottom 55%"
          >
            {problem.narrative.map((seg) => ({
              text: seg.text,
              className: seg.hl ? `hl hl--${seg.hl}` : undefined,
            }))}
          </ScrollReveal>
          <div className="why-doodle why-doodle-trail" aria-hidden="true">
            <span className="trail-dot" />
            <span className="trail-dot" />
            <span className="trail-dot" />
            <span className="trail-dot" />
            <span className="trail-dot" />
            <span className="trail-lock">
              <LockGlyph />
            </span>
          </div>
        </div>
        <p className="replay-hint">keep scrolling — the words come in</p>

        <div className="replay-scenes">
          {[
            { ...problem.incident, tone: "incident" as const, time: problem.times[0] },
            { ...problem.wrong, tone: "wrong" as const, time: problem.times[1] },
            { ...problem.right, tone: "right" as const, time: problem.times[2] },
          ].map((s) => (
            <SceneCard key={s.num} {...s} />
          ))}
        </div>
      </div>
    </section>
  );
}