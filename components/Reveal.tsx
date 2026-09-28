"use client";

// <Reveal> and <RevealGroup>: the one helper for scroll-in animation.
// Same effect everywhere: opacity 0 + translateY 16px → visible, 450ms,
// cubic-bezier(0.22, 1, 0.36, 1). Opacity/transform only, so no layout shift.
// Hidden states are applied by GSAP at runtime — the server HTML always
// carries the full text, so SEO is unaffected. Reduced motion renders
// everything instantly with no animation at all.

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { motionAllowed } from "@/lib/anim";
import { wasRecentPop } from "@/lib/route-anim";

gsap.registerPlugin(ScrollTrigger, CustomEase);

// cubic-bezier(0.22, 1, 0.36, 1), registered once as a named GSAP ease.
let easeRegistered = false;
if (typeof window !== "undefined" && !easeRegistered) {
  easeRegistered = true;
  CustomEase.create("reveal", "0.22,1,0.36,1");
}
const EASE = "reveal";

// Elements already animated once (e.g. React strict-mode remounts in dev)
// are left visible instead of replaying.
const done = new WeakSet<Element>();

type RevealProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** extra delay before this block starts, in seconds */
  delay?: number;
};

export function Reveal({ children, className, style, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !motionAllowed() || done.has(el)) return;
    const short = wasRecentPop();
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { y: 16, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: short ? 0.25 : 0.45,
          delay,
          ease: EASE,
          clearProps: "transform,opacity",
          onComplete: () => done.add(el),
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        }
      );
    }, el);
    return () => ctx.revert();
  }, [delay]);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}

type RevealGroupProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** seconds between items; total stagger is capped near 600ms */
  stagger?: number;
};

export function RevealGroup({ children, className, style, stagger = 0.06 }: RevealGroupProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const parent = ref.current;
    if (!parent || !motionAllowed()) return;
    const items = Array.from(parent.children).filter((c) => !done.has(c));
    if (items.length === 0) return;
    const short = wasRecentPop();
    const step = short ? 0 : Math.min(stagger, 0.6 / Math.max(1, items.length - 1));
    const ctx = gsap.context(() => {
      gsap.fromTo(
        items,
        { y: 16, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: short ? 0.25 : 0.45,
          stagger: step,
          ease: EASE,
          clearProps: "transform,opacity",
          onComplete: () => items.forEach((c) => done.add(c)),
          scrollTrigger: { trigger: parent, start: "top 88%", once: true },
        }
      );
    }, parent);
    return () => ctx.revert();
  }, [stagger]);

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
