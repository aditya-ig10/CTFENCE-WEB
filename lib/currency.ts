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

const SUPPORTED_CURRENCIES: Record<CurrencyCode, { rate: number; locale: string }> = {
  USD: { rate: 1, locale: "en-US" },
  INR: { rate: 84, locale: "en-IN" },
  EUR: { rate: 0.92, locale: "de-DE" },
  GBP: { rate: 0.79, locale: "en-GB" },
  JPY: { rate: 155, locale: "ja-JP" },
  AUD: { rate: 1.52, locale: "en-AU" },
  CAD: { rate: 1.37, locale: "en-CA" },
  SGD: { rate: 1.35, locale: "en-SG" },
  AED: { rate: 3.67, locale: "en-AE" },
  BRL: { rate: 5.4, locale: "pt-BR" },
};

const COUNTRY_TO_CURRENCY: Record<string, CurrencyCode> = {
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
  IN: "INR",
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
  return SUPPORTED_CURRENCIES[currency].locale;
}

export function formatMoney(
  usd: number,
  currency: CurrencyCode,
  locale: string
): string {
  const rate = SUPPORTED_CURRENCIES[currency].rate;
  const value = Math.round(usd * rate);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
