"use client";

import { useEffect, useState } from "react";
import {
  currencyFromLocale,
  formatMoney,
  localeForCurrency,
  type CurrencyCode,
} from "@/lib/currency";

export default function Money({
  usd,
  usdMax,
  currency,
  locale,
  preferLocale,
}: {
  usd: number;
  usdMax?: number;
  currency: CurrencyCode;
  locale: string;
  preferLocale: boolean;
}) {
  const [cur, setCur] = useState<CurrencyCode>(currency);
  const [loc, setLoc] = useState(locale);

  useEffect(() => {
    if (!preferLocale) return;
    const nav = currencyFromLocale(navigator.language);
    if (nav && nav !== currency) {
      setCur(nav);
      setLoc(localeForCurrency(nav));
    }
  }, [preferLocale, currency]);

  const text =
    usdMax !== undefined
      ? `${formatMoney(usd, cur, loc)}–${formatMoney(usdMax, cur, loc)}`
      : formatMoney(usd, cur, loc);

  return <span className="plan-price">{text}</span>;
}
