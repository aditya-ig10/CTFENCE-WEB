"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  currencyFromLocale,
  fetchFxRates,
  formatMoney,
  localeForCurrency,
  staticRates,
  type CurrencyCode,
  type FxRates,
} from "@/lib/currency";
import { RollingNumber } from "@/components/PricingMotion";

// price display: monthly INR base; converts to the visitor's currency with
// live FX rates (fetched once per page load, static snapshot until they
// arrive). plain renders without the plan-price class for inline use.
export default function Money({
  inr,
  currency,
  locale,
  preferLocale,
  plain = false,
  animated = false,
}: {
  inr: number;
  currency: CurrencyCode;
  locale: string;
  preferLocale: boolean;
  plain?: boolean;
  animated?: boolean;
}) {
  const [cur, setCur] = useState<CurrencyCode>(currency);
  const [loc, setLoc] = useState(locale);
  const [rates, setRates] = useState<FxRates>(staticRates);

  useEffect(() => {
    if (!preferLocale) return;
    const nav = currencyFromLocale(navigator.language);
    if (nav && nav !== currency) {
      setCur(nav);
      setLoc(localeForCurrency(nav));
    }
  }, [preferLocale, currency]);

  useEffect(() => {
    let cancelled = false;
    fetchFxRates().then((live) => {
      if (live && !cancelled) setRates(live);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = Math.round(inr * (rates[cur] ?? staticRates()[cur] ?? 0));

  // odometer mode: currency symbol/suffix stay pinned, digit runs roll.
  if (animated) {
    const parts = new Intl.NumberFormat(loc, {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 0,
    }).formatToParts(value);
    const nodes: ReactNode[] = [];
    let buf = "";
    const flush = (key: string) => {
      if (buf) {
        nodes.push(<RollingNumber key={key} formatted={buf} />);
        buf = "";
      }
    };
    parts.forEach((p, i) => {
      if (p.type === "integer" || p.type === "group" || p.type === "decimal" || p.type === "fraction") {
        buf += p.value;
      } else {
        flush(`n${i}`);
        nodes.push(<span key={`s${i}`}>{p.value}</span>);
      }
    });
    flush("end");
    return plain ? <span>{nodes}</span> : <span className="plan-price">{nodes}</span>;
  }

  return plain ? (
    <span>{formatMoney(inr, cur, loc, rates[cur])}</span>
  ) : (
    <span className="plan-price">{formatMoney(inr, cur, loc, rates[cur])}</span>
  );
}
