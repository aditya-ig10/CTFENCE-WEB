"use client";

import { useState } from "react";
import Link from "next/link";
import CheckIcon from "@/components/CheckIcon";
import Money from "@/components/Money";
import { PLAN_PRICING, type PlanId } from "@/lib/checkout";
import type { CurrencyCode } from "@/lib/currency";
import type { Plan } from "@/content/copy";

// one pricing card — client component so each card can expand/collapse its
// own feature list ("read more"). collapsed shows the first COLLAPSE_AT
// features; "everything in X" plans keep their lead item visible.
//
// billing: monthly shows the flat monthly price; yearly (default) shows the
// discounted monthly-equivalent ($18 Starter / $90 Teams) plus the billed
// annual total underneath.
const COLLAPSE_AT = 5;

function planIdForName(name: string): PlanId | null {
  const n = name.toLowerCase();
  if (n === "starter") return "starter";
  if (n === "teams") return "teams";
  return null;
}

export default function PlanCard({
  plan,
  currency,
  locale,
  preferLocale,
  billingCycle = "yearly",
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
  const pid = planIdForName(plan.name);
  const discount = billingCycle === "yearly" && pid ? PLAN_PRICING[pid].yearlyDiscount : 0;
  // yearly shows the discounted monthly-equivalent (e.g. $18), not 12× lump
  const displayPrice = Math.round(priceInr * (1 - discount));
  const displayPeriod =
    plan.priceInr === null || plan.priceInr === 0
      ? plan.period
      : billingCycle === "yearly"
        ? "per month · billed annually"
        : plan.period;

  // keep the CTA cycle in sync with the toggle (paid plans only)
  const ctaHref =
    pid && !plan.cta.href.startsWith("mailto")
      ? `/checkout?plan=${pid}&cycle=${billingCycle}`
      : plan.cta.href;

  // annual mode: strike off the monthly price, then show the annual rate
  const showStrike = billingCycle === "yearly" && pid !== null && priceInr > 0;

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
        <span className="plan-price-swap">
          <Money inr={displayPrice} currency={currency} locale={locale} preferLocale={preferLocale} animated />
          {showStrike && (
            <span className="plan-strike">
              <Money inr={priceInr} currency={currency} locale={locale} preferLocale={preferLocale} plain />
            </span>
          )}
        </span>
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
          {expanded ? (
            "show less"
          ) : (
            <>
              read more <span className="plan-readmore-count">· {hidden} more</span>
            </>
          )}
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
        <Link href={ctaHref} className={`plan-btn${plan.cta.primary ? " primary" : ""}`}>
          {plan.cta.label}
        </Link>
      )}
    </article>
  );
}