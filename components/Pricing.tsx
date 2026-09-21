import Link from "next/link";
import { headers } from "next/headers";
import PricingPlans from "@/components/PricingPlans";
import RevealOnScroll from "@/app/components/RevealOnScroll";
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
        <RevealOnScroll>
          <div className="pricing-head">
            <div className="section-eyebrow">{pricing.eyebrow}</div>
            <h2 className="section-title" id="pricing-title">
              {pricing.title}
            </h2>
            <p className="section-lead">{pricing.lead}</p>
          </div>
        </RevealOnScroll>

        <RevealOnScroll delay={120}>
          <PricingPlans
            plans={pricing.plans}
            currency={currency}
            locale={locale}
            preferLocale={preferLocale}
          />
        </RevealOnScroll>

        <RevealOnScroll delay={180}>
          <p className="fine-print">
            {pricing.finePrint}{" "}
            <Link href={pricing.finePrintLink.href}>{pricing.finePrintLink.label}</Link>.
          </p>
        </RevealOnScroll>
      </div>
    </section>
  );
}