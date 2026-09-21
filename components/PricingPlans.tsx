"use client";

import { useState } from "react";
import PlanCard from "@/components/PlanCard";
import type { Plan } from "@/content/copy";
import type { CurrencyCode } from "@/lib/currency";

export type BillingCycleOption = "monthly" | "yearly";

// interactive pricing grid — annual is the default (Starter $18/mo,
// Teams $90/mo billed annually); toggle switches to monthly
// ($22 / $105 per month).
export default function PricingPlans({
  plans,
  currency,
  locale,
  preferLocale,
}: {
  plans: Plan[];
  currency: CurrencyCode;
  locale: string;
  preferLocale: boolean;
}) {
  const [cycle, setCycle] = useState<BillingCycleOption>("yearly");

  return (
    <>
      <div className="billing-toggle" role="group" aria-label="Billing period" data-cycle={cycle}>
        <span className="billing-toggle-slider" aria-hidden="true" />
        <button
          type="button"
          className={`billing-toggle-btn${cycle === "monthly" ? " is-active" : ""}`}
          aria-pressed={cycle === "monthly"}
          onClick={() => setCycle("monthly")}
        >
          Monthly
        </button>
        <button
          type="button"
          className={`billing-toggle-btn${cycle === "yearly" ? " is-active" : ""}`}
          aria-pressed={cycle === "yearly"}
          onClick={() => setCycle("yearly")}
        >
          Annual
          <span className="billing-toggle-save">save ~18%</span>
        </button>
      </div>
      <div className="plans">
        {plans.map((p) => (
          <PlanCard
            key={p.name}
            plan={p}
            currency={currency}
            locale={locale}
            preferLocale={preferLocale}
            billingCycle={cycle}
          />
        ))}
      </div>
    </>
  );
}
