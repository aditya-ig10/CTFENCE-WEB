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

// ISO-3166 (plus UK alias) → display + settlement currency. every region
// maps to its own currency where we support one; the rest fall back to USD
// so no visitor is stuck on a foreign symbol. kept in sync with
// CHECKOUT_CURRENCIES in lib/checkout (every value here must be settleable).
const COUNTRY_TO_CURRENCY: Record<string, CurrencyCode> = {
  // South Asia
  IN: "INR",
  PK: "USD",
  BD: "USD",
  LK: "USD",
  NP: "USD",
  BT: "INR",
  MV: "USD",
  AF: "USD",
  // North America
  US: "USD",
  CA: "CAD",
  MX: "USD",
  GT: "USD",
  BZ: "USD",
  HN: "USD",
  SV: "USD",
  NI: "USD",
  CR: "USD",
  PA: "USD",
  CU: "USD",
  DO: "USD",
  JM: "USD",
  HT: "USD",
  TT: "USD",
  BB: "USD",
  BS: "USD",
  GL: "USD",
  BM: "USD",
  // South America
  BR: "BRL",
  AR: "USD",
  CL: "USD",
  CO: "USD",
  PE: "USD",
  VE: "USD",
  EC: "USD",
  UY: "USD",
  PY: "USD",
  BO: "USD",
  GY: "USD",
  SR: "USD",
  // Europe — Eurozone
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
  SK: "EUR",
  SI: "EUR",
  EE: "EUR",
  LV: "EUR",
  LT: "EUR",
  LU: "EUR",
  MT: "EUR",
  CY: "EUR",
  HR: "EUR",
  AD: "EUR",
  MC: "EUR",
  SM: "EUR",
  VA: "EUR",
  ME: "EUR",
  // Europe — non-euro (settle in EUR; closer than USD for these visitors)
  SE: "EUR",
  NO: "EUR",
  DK: "EUR",
  CH: "EUR",
  PL: "EUR",
  CZ: "EUR",
  HU: "EUR",
  RO: "EUR",
  BG: "EUR",
  IS: "EUR",
  AL: "EUR",
  RS: "EUR",
  BA: "EUR",
  MK: "EUR",
  UA: "EUR",
  MD: "EUR",
  BY: "EUR",
  RU: "EUR",
  TR: "EUR",
  GB: "GBP",
  UK: "GBP",
  GG: "GBP",
  JE: "GBP",
  IM: "GBP",
  GI: "GBP",
  // Middle East — Gulf settles in AED, rest in USD
  AE: "AED",
  SA: "AED",
  QA: "AED",
  KW: "AED",
  BH: "AED",
  OM: "AED",
  YE: "USD",
  IQ: "USD",
  IR: "USD",
  JO: "USD",
  LB: "USD",
  IL: "USD",
  PS: "USD",
  SY: "USD",
  // Asia-Pacific
  JP: "JPY",
  AU: "AUD",
  NZ: "AUD",
  FJ: "AUD",
  PG: "AUD",
  SG: "SGD",
  CN: "USD",
  KR: "USD",
  KP: "USD",
  HK: "USD",
  TW: "USD",
  TH: "USD",
  MY: "USD",
  ID: "USD",
  PH: "USD",
  VN: "USD",
  KH: "USD",
  LA: "USD",
  MM: "USD",
  MN: "USD",
  KZ: "USD",
  UZ: "USD",
  TM: "USD",
  KG: "USD",
  TJ: "USD",
  GE: "USD",
  AM: "USD",
  AZ: "USD",
  // Africa — USD fallback everywhere (no local settlement currency yet)
  ZA: "USD",
  NG: "USD",
  KE: "USD",
  EG: "USD",
  GH: "USD",
  ET: "USD",
  TZ: "USD",
  UG: "USD",
  RW: "USD",
  MA: "USD",
  DZ: "USD",
  TN: "USD",
  LY: "USD",
  SD: "USD",
  CM: "USD",
  SN: "USD",
  CI: "USD",
  MU: "USD",
  SC: "USD",
  BW: "USD",
  NA: "USD",
  ZM: "USD",
  ZW: "USD",
  MW: "USD",
  MZ: "USD",
  MG: "USD",
};

// billing-country names (what the checkout form + geo APIs hand us) → ISO.
// keys are lowercase; keep the checkout page's country list in sync with this.
const COUNTRY_NAME_TO_ISO: Record<string, string> = {
  india: "IN",
  "united states": "US",
  "united states of america": "US",
  usa: "US",
  canada: "CA",
  brazil: "BR",
  brasil: "BR",
  "united kingdom": "GB",
  uk: "GB",
  britain: "GB",
  "great britain": "GB",
  england: "GB",
  germany: "DE",
  deutschland: "DE",
  france: "FR",
  spain: "ES",
  españa: "ES",
  italy: "IT",
  italia: "IT",
  netherlands: "NL",
  holland: "NL",
  ireland: "IE",
  austria: "AT",
  belgium: "BE",
  portugal: "PT",
  finland: "FI",
  greece: "GR",
  poland: "PL",
  sweden: "SE",
  norway: "NO",
  denmark: "DK",
  switzerland: "CH",
  japan: "JP",
  australia: "AU",
  "new zealand": "NZ",
  singapore: "SG",
  "united arab emirates": "AE",
  uae: "AE",
  "saudi arabia": "SA",
  qatar: "QA",
  kuwait: "KW",
  bahrain: "BH",
  oman: "OM",
  mexico: "MX",
  argentina: "AR",
  chile: "CL",
  colombia: "CO",
  china: "CN",
  "south korea": "KR",
  korea: "KR",
  "south africa": "ZA",
  southafrica: "ZA",
  nigeria: "NG",
  kenya: "KE",
  egypt: "EG",
  indonesia: "ID",
  malaysia: "MY",
  thailand: "TH",
  philippines: "PH",
  vietnam: "VN",
  turkey: "TR",
  türkiye: "TR",
  israel: "IL",
  "hong kong": "HK",
  hongkong: "HK",
  taiwan: "TW",
};

export function isoFromCountry(
  country: string | null | undefined
): string | null {
  if (!country) return null;
  const raw = country.trim();
  if (!raw) return null;
  if (raw.length === 2) return raw.toUpperCase();
  const iso = COUNTRY_NAME_TO_ISO[raw.toLowerCase()];
  return iso ?? null;
}

// geo-aware lookup — accepts an ISO code ("DE"), a billing name
// ("Germany"), or null (unknown → USD). shared by the pricing section
// (display) and checkout (settlement) so both always agree.
export function currencyFromCountry(
  country: string | null | undefined
): CurrencyCode {
  if (country) {
    const raw = country.trim();
    if (raw.length === 2) {
      const found = COUNTRY_TO_CURRENCY[raw.toUpperCase()];
      if (found) return found;
    } else {
      const iso = COUNTRY_NAME_TO_ISO[raw.toLowerCase()];
      if (iso) {
        const found = COUNTRY_TO_CURRENCY[iso];
        if (found) return found;
      }
    }
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

// razorpay (like stripe) wants zero-decimal currencies in whole units, not
// paise/cents. only JPY in our set qualifies.
export function isZeroDecimalCurrency(currency: string): boolean {
  return currency === "JPY";
}

export function toMinorUnits(currency: CurrencyCode, major: number): number {
  const rounded = Math.round(major);
  return isZeroDecimalCurrency(currency) ? rounded : rounded * 100;
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
