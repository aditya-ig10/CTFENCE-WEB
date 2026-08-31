import Link from "next/link";
import { headers } from "next/headers";
import PlanCard from "@/components/PlanCard";
import { pricing } from "@/content/copy";
import {
  currencyFromCountry,
  localeForCurrency,
  type CurrencyCode,
} from "@/lib/currency";

export default function Pricing() {
  const country = headers().get("x-vercel-ip-country") ?? null;
  const currency: CurrencyCode = currencyFromCountry(country);
  const locale = localeForCurrency(currency);
  const preferLocale = !country;

  return (
    <section className="section pricing pricing--full" id="pricing" aria-labelledby="pricing-title">
      <div className="container">
        <div className="pricing-head">
          <div className="section-eyebrow">{pricing.eyebrow}</div>
          <h2 className="section-title" id="pricing-title">
            {pricing.title}
          </h2>
          <p className="section-lead">{pricing.lead}</p>
        </div>

        <div className="plans">
          {pricing.plans.map((p) => (
            <PlanCard
              key={p.name}
              plan={p}
              currency={currency}
              locale={locale}
              preferLocale={preferLocale}
            />
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