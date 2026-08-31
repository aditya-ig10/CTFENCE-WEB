"use client";

import { useState } from "react";
import Link from "next/link";
import CheckIcon from "@/components/CheckIcon";
import Money from "@/components/Money";
import type { CurrencyCode } from "@/lib/currency";
import type { Plan } from "@/content/copy";

// one pricing card — client component so each card can expand/collapse its
// own feature list ("read more"). collapsed shows the first COLLAPSE_AT
// features; "everything in X" plans keep their lead item visible.
const COLLAPSE_AT = 5;

export default function PlanCard({
  plan,
  currency,
  locale,
  preferLocale,
  billingCycle = "monthly",
}: {
  plan: Plan;
  currency: CurrencyCode;
  locale: string;
  preferLocale: boolean;
  billingCycle?: "monthly" | "yearly";
}) {
  const [expanded, setExpanded] = useState(false);

  const hidden = Math.max(0, plan.features.length - COLLAPSE_AT);
  const visible = expanded ? plan.features : plan.features.slice(0, COLLAPSE_AT);

  const priceInr = plan.priceInr ?? 0;
  const cycleMultiplier = billingCycle === "yearly" ? 12 : 1;
  const cycleDiscount = billingCycle === "yearly" ? 0.08 : 0;
  const displayPrice = Math.round(priceInr * cycleMultiplier * (1 - cycleDiscount));
  const displayPeriod = billingCycle === "yearly" ? " per year" : plan.period;

  return (
    <article
      className={`plan${plan.badge ? " plan--featured" : ""} plan--${plan.status}`}
    >
      {plan.badge && <div className="plan-badge">{plan.badge}</div>}
      <div className="plan-top">
        <h3 className="plan-name">{plan.name}</h3>
      </div>
      {plan.priceInr === null ? (
        <span className="plan-price">Contact us</span>
      ) : (
        <Money inr={displayPrice} currency={currency} locale={locale} preferLocale={preferLocale} />
      )}
      <div className="plan-period">{displayPeriod}</div>
      <div className="plan-meta">
        <span>{plan.nodes}</span>
        <span>{plan.retention}</span>
      </div>
      {plan.overage && <div className="plan-overage">{plan.overage}</div>}
      <div className="plan-divider" />
      <div className="plan-features">
        {visible.map((f) => (
          <div className="plan-feature" key={f}>
            <CheckIcon />
            {f}
          </div>
        ))}
      </div>
      {hidden > 0 && (
        <button
          type="button"
          className="plan-readmore"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "show less" : `read more · ${hidden} more`}
          <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
      <div className="plan-spacer" />
      {plan.cta.href.startsWith("mailto") ? (
        <a href={plan.cta.href} className={`plan-btn${plan.cta.primary ? " primary" : ""}`}>
          {plan.cta.label}
        </a>
      ) : (
        <Link href={plan.cta.href} className={`plan-btn${plan.cta.primary ? " primary" : ""}`}>
          {plan.cta.label}
        </Link>
      )}
    </article>
  );
}