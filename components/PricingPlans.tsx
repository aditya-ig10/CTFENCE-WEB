"use client";

import { useState } from "react";
import PlanCard from "@/components/PlanCard";
import { BillingToggle, type Billing as BillingCycleOption } from "@/components/PricingMotion";
import type { Plan } from "@/content/copy";
import type { CurrencyCode } from "@/lib/currency";

// interactive pricing grid — annual is the default (Starter $18/mo,
// Teams $90/mo billed annually); toggle switches to monthly
// ($22 / $105 per month). thumb + digits animate via the motion lib.
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
      <BillingToggle value={cycle} onChange={setCycle} saving="save ~18%" />
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
