"use client";

import { useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import CheckIcon from "@/components/CheckIcon";
import { pricing } from "@/content/copy";
import { motionAllowed } from "@/lib/anim";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function Pricing() {
  const plansRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!motionAllowed()) return;
      const plans = plansRef.current?.querySelectorAll(":scope > .plan");
      if (!plans?.length) return;
      const ctx = gsap.context(() => {
        gsap.set(plans, { opacity: 0, y: 20 });
        gsap.to(plans, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power2.out",
          scrollTrigger: { trigger: plansRef.current, start: "top 85%", once: true },
        });
      }, plansRef);
      return () => ctx.revert();
    },
    { scope: plansRef }
  );

  return (
    <section className="section pricing" id="pricing" aria-labelledby="pricing-title">
      <div className="container" style={{ padding: 0 }}>
        <div className="section-eyebrow">{pricing.eyebrow}</div>
        <h2 className="section-title" id="pricing-title">{pricing.title}</h2>
        <p className="section-lead" style={{ marginBottom: 0 }}>{pricing.lead}</p>
        <div className="plans" ref={plansRef}>
          {pricing.plans.map((p) => (
            <div className={`plan${p.badge ? " featured" : ""}`} key={p.name}>
              {p.badge && <div className="plan-badge">{p.badge}</div>}
              <div className="plan-name">{p.name}</div>
              <div className="plan-price">
                {p.sup && <sup>{p.sup}</sup>}
                {p.price}
              </div>
              <div className="plan-period">{p.period}</div>
              <div className="plan-divider" />
              {p.features.map((f) => (
                <div className="plan-feature" key={f}>
                  <CheckIcon />
                  {f}
                </div>
              ))}
              {p.cta.href.startsWith("mailto") ? (
                <a href={p.cta.href} className={`plan-btn${p.cta.primary ? " primary" : ""}`}>
                  {p.cta.label}
                </a>
              ) : (
                <Link href={p.cta.href} className={`plan-btn${p.cta.primary ? " primary" : ""}`}>
                  {p.cta.label}
                </Link>
              )}
            </div>
          ))}
        </div>
        <p className="fine-print">
          {pricing.finePrint}{" "}
          <Link href={pricing.finePrintLink.href}>{pricing.finePrintLink.label}</Link>.
        </p>
      </div>
    </section>
  );
}