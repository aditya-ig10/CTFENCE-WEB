"use client";

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

// price display: monthly INR base; converts to the visitor's currency with
// live FX rates (fetched once per page load, static snapshot until they
// arrive). plain renders without the plan-price class for inline use.
export default function Money({
  inr,
  currency,
  locale,
  preferLocale,
  plain = false,
}: {
  inr: number;
  currency: CurrencyCode;
  locale: string;
  preferLocale: boolean;
  plain?: boolean;
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

  return plain ? (
    <span>{formatMoney(inr, cur, loc, rates[cur])}</span>
  ) : (
    <span className="plan-price">{formatMoney(inr, cur, loc, rates[cur])}</span>
  );
}
