export type CurrencyCode =
  | "USD"
  | "INR"
  | "EUR"
  | "GBP"
  | "JPY"
  | "AUD"
  | "CAD"
  | "SGD"
  | "AED"
  | "BRL";

// pricing base is USD (headline: Starter $22/mo monthly, $18/mo annual;
// Teams $105/mo monthly, $90/mo annual). rates below are "currency units
// per 1 INR" — static snapshot is only a fallback; Money() refreshes them
// live from open.er-api.com (free, no key) on the client.
// snapshot: 2026-09-27 — 1 USD = 95.878915 INR (er-api latest/USD).
const STATIC_RATES: Record<CurrencyCode, { rate: number; locale: string }> = {
  INR: { rate: 1, locale: "en-IN" },
  USD: { rate: 0.01042986, locale: "en-US" },
  EUR: { rate: 0.00915236, locale: "de-DE" },
  GBP: { rate: 0.00787546, locale: "en-GB" },
  JPY: { rate: 1.642223, locale: "ja-JP" },
  AUD: { rate: 0.0148472, locale: "en-AU" },
  CAD: { rate: 0.01474488, locale: "en-CA" },
  SGD: { rate: 0.01332724, locale: "en-SG" },
  AED: { rate: 0.0383036, locale: "en-AE" },
  BRL: { rate: 0.054151, locale: "pt-BR" },
};

const COUNTRY_TO_CURRENCY: Record<string, CurrencyCode> = {
  IN: "INR",
  US: "USD",
  CA: "CAD",
  BR: "BRL",
  GB: "GBP",
  DE: "EUR",
  FR: "EUR",
  ES: "EUR",
  IT: "EUR",
  NL: "EUR",
  IE: "EUR",
  AT: "EUR",
  BE: "EUR",
  PT: "EUR",
  FI: "EUR",
  GR: "EUR",
  PL: "EUR",
  SE: "EUR",
  JP: "JPY",
  AU: "AUD",
  NZ: "AUD",
  SG: "SGD",
  AE: "AED",
};

export function currencyFromCountry(
  country: string | null | undefined
): CurrencyCode {
  if (country) {
    const found = COUNTRY_TO_CURRENCY[country.toUpperCase()];
    if (found) return found;
  }
  return "USD";
}

export function currencyFromLocale(locale: string): CurrencyCode | null {
  const match = /[-_]([A-Za-z]{2})$/.exec(locale);
  if (!match) return null;
  return COUNTRY_TO_CURRENCY[match[1].toUpperCase()] ?? null;
}

export function localeForCurrency(currency: CurrencyCode): string {
  return STATIC_RATES[currency].locale;
}

// server-side fallback rate (currency units per 1 INR) — used by the order
// endpoint so amounts never depend on client input
export function ratePerInrStatic(currency: CurrencyCode): number {
  return STATIC_RATES[currency].rate;
}

export type FxRates = Record<CurrencyCode, number>;

// module-level cache so the fetch happens once per page load, shared by
// every Money instance on the page
let liveRates: FxRates | null = null;
let liveRatesPromise: Promise<FxRates | null> | null = null;

export function staticRates(): FxRates {
  return Object.fromEntries(
    Object.entries(STATIC_RATES).map(([c, v]) => [c, v.rate])
  ) as FxRates;
}

// live FX, cached; returns null on failure so callers keep the static table
export function fetchFxRates(): Promise<FxRates | null> {
  if (liveRates) return Promise.resolve(liveRates);
  if (liveRatesPromise) return liveRatesPromise;
  liveRatesPromise = (async () => {
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/INR");
      if (!res.ok) return null;
      const json = (await res.json()) as {
        result?: string;
        rates?: Record<string, number>;
      };
      if (json.result !== "success" || !json.rates) return null;
      const rates = {} as FxRates;
      let ok = false;
      for (const code of Object.keys(STATIC_RATES) as CurrencyCode[]) {
        const r = json.rates[code];
        if (typeof r === "number" && r > 0) {
          rates[code] = r;
          ok = true;
        } else {
          rates[code] = STATIC_RATES[code].rate;
        }
      }
      if (!ok) return null;
      liveRates = rates;
      return rates;
    } catch {
      return null;
    } finally {
      liveRatesPromise = null;
    }
  })();
  return liveRatesPromise;
}

export function formatMoney(
  inr: number,
  currency: CurrencyCode,
  locale: string,
  ratePerInr?: number
): string {
  const rate = ratePerInr ?? STATIC_RATES[currency].rate;
  const value = Math.round(inr * rate);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
