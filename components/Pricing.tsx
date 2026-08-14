import Link from "next/link";
import CheckIcon from "@/components/CheckIcon";
import { pricing } from "@/content/copy";

export default function Pricing() {
  return (
    <section className="section pricing" id="pricing" aria-labelledby="pricing-title">
      <div className="container" style={{ padding: 0 }}>
        <div className="section-eyebrow">{pricing.eyebrow}</div>
        <h2 className="section-title" id="pricing-title">{pricing.title}</h2>
        <p className="section-lead" style={{ marginBottom: 0 }}>{pricing.lead}</p>
        <div className="plans">
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