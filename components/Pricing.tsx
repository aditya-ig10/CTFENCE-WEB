import Link from "next/link";
import { headers } from "next/headers";
import CheckIcon from "@/components/CheckIcon";
import Money from "@/components/Money";
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
    <section className="section pricing" id="pricing" aria-labelledby="pricing-title">
      <div className="container" style={{ padding: 0 }}>
        <div className="pricing-head">
          <div className="section-eyebrow">{pricing.eyebrow}</div>
          <h2 className="section-title" id="pricing-title">
            {pricing.title}
          </h2>
          <p className="section-lead">{pricing.lead}</p>
        </div>

        <div className="plans">
          {pricing.plans.map((p) => (
            <article
              className={`plan${p.badge ? " plan--featured" : ""} plan--${p.status}`}
              key={p.name}
            >
              {p.badge && <div className="plan-badge">{p.badge}</div>}
              <div className="plan-top">
                <h3 className="plan-name">{p.name}</h3>
                {p.chip && <span className={`plan-chip plan-chip--${p.status}`}>{p.chip}</span>}
              </div>
              <Money
                usd={p.priceUsd}
                usdMax={p.priceUsdMax}
                currency={currency}
                locale={locale}
                preferLocale={preferLocale}
              />
              <div className="plan-period">{p.period}</div>
              <div className="plan-divider" />
              <div className="plan-features">
                {p.features.map((f) => (
                  <div className="plan-feature" key={f}>
                    <CheckIcon />
                    {f}
                  </div>
                ))}
              </div>
              {p.cta.href.startsWith("mailto") ? (
                <a href={p.cta.href} className={`plan-btn${p.cta.primary ? " primary" : ""}`}>
                  {p.cta.label}
                </a>
              ) : (
                <Link href={p.cta.href} className={`plan-btn${p.cta.primary ? " primary" : ""}`}>
                  {p.cta.label}
                </Link>
              )}
              {p.status === "soon" && (
                <span className="plan-soon-note">coming soon · planned pricing</span>
              )}
            </article>
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
