import type { CurrencyCode } from "@/lib/currency";
import { ratePerInrStatic } from "@/lib/currency";

// checkout pricing — everything here runs on the server (or is shared
// constants): the amount charged is always recomputed from the plan id,
// never trusted from the client. currency conversion uses the same static
// snapshot the site displays with until live rates land.

// currencies razorpay standard checkout can settle in
export const CHECKOUT_CURRENCIES = ["INR", "USD", "EUR", "GBP", "SGD", "AED", "AUD", "CAD"] as const;
export type CheckoutCurrency = (typeof CHECKOUT_CURRENCIES)[number];

export function isCheckoutCurrency(v: unknown): v is CheckoutCurrency {
  return typeof v === "string" && (CHECKOUT_CURRENCIES as readonly string[]).includes(v);
}

// referral codes — fraction off the plan price. codes are public on purpose:
// the only thing they gate is the discount, and the server recomputes it.
export const REFERRAL_CODES: Record<string, number> = {
  FENCE10: 0.1,
  EARLYBIRD: 0.15,
  SYNTHRUN: 0.2,
};

export function referralDiscount(code: string | null | undefined): number {
  if (!code) return 0;
  return REFERRAL_CODES[code.trim().toUpperCase()] ?? 0;
}

const PLAN_IDS = ["starter", "teams"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export function isPlanId(v: unknown): v is PlanId {
  return typeof v === "string" && (PLAN_IDS as readonly string[]).includes(v);
}

// plan node pricing. the site scales on enforcement nodes (not seats); policy
// count is unlimited on every tier. price = perNodeInr × chosen nodes, then
// tax is applied per the billing country. the INR base mirrors content/copy.ts.
export type PlanPricing = {
  name: string;
  perNodeInr: number; // price per enforcement node, in INR
  minNodes: number; // included nodes at the plan's headline price
  maxNodes: number; // cap a purchaser can pick on the checkout page
};

export const PLAN_PRICING: Record<PlanId, PlanPricing> = {
  starter: { name: "Starter", perNodeInr: 500, minNodes: 3, maxNodes: 10 },
  teams: { name: "Teams", perNodeInr: 840, minNodes: 10, maxNodes: 50 },
};

export type BillingCycle = "monthly" | "yearly";

export function isBillingCycle(v: unknown): v is BillingCycle {
  return v === "monthly" || v === "yearly";
}

export function planBaseInr(planId: PlanId): number {
  return PLAN_PRICING[planId].perNodeInr * PLAN_PRICING[planId].minNodes;
}
export function planNodeLimits(planId: PlanId): { min: number; max: number } {
  const p = PLAN_PRICING[planId];
  return { min: p.minNodes, max: p.maxNodes };
}
export function clampNodes(planId: PlanId, n: number): number {
  const { min, max } = planNodeLimits(planId);
  return Math.min(Math.max(Math.round(n ?? min), min), max);
}

export function getExpiryDate(billingCycle: BillingCycle = "monthly"): Date {
  const now = new Date();
  const days = billingCycle === "yearly" ? 365 : 30;
  const d = new Date(now.getTime() + days * 864e5);
  // set to end of that day 23:59:59.999 in local time to avoid off-by-one on the expiring day
  d.setHours(23, 59, 59, 999);
  return d;
}

// additive tax rates, keyed by both country name and ISO code so lookups work
// regardless of which form the checkout sends. B2C sales of the INR-priced
// plans; tax is added on the discounted subtotal. unknown → 20% so no sale
// ships tax-free.
export const COUNTRY_TAX: Record<string, number> = {
  // India — 18% GST
  india: 0.18, in: 0.18,
  // North America / Oceania
  "united states": 0, us: 0, usa: 0, canada: 0.05, ca: 0.05,
  australia: 0.1, au: 0.1, nz: 0.15, "new zealand": 0.15,
  // UK / Europe
  "united kingdom": 0.2, gb: 0.2, uk: 0.2,
  germany: 0.19, de: 0.19, france: 0.2, fr: 0.2, spain: 0.21, es: 0.21,
  italy: 0.22, it: 0.22, netherlands: 0.21, nl: 0.21, sweden: 0.25, se: 0.25,
  norway: 0.25, no: 0.25, denmark: 0.25, dk: 0.25, finland: 0.24, fi: 0.24,
  switzerland: 0.077, ch: 0.077, austria: 0.2, at: 0.2, belgium: 0.21, be: 0.21,
  ireland: 0.23, ie: 0.23, portugal: 0.23, pt: 0.23, poland: 0.23, pl: 0.23,
  // Asia
  singapore: 0.09, sg: 0.09, "united arab emirates": 0.05, ae: 0.05,
  japan: 0.1, jp: 0.1, "south korea": 0.1, kr: 0.1, korea: 0.10,
  china: 0.13, cn: 0.13, hongkong: 0.0, hk: 0.0,
  // Latam / Africa / MENA
  brazil: 0.17, br: 0.17, mexico: 0.16, mx: 0.16,
  southafrica: 0.15, "south africa": 0.15, za: 0.15,
};
export const DEFAULT_TAX_RATE = 0.2;
export function taxRateForCountry(country: string | null | undefined): number {
  if (!country) return DEFAULT_TAX_RATE;
  const k = country.trim().toLowerCase();
  if (k in COUNTRY_TAX) return COUNTRY_TAX[k];
  const iso = country.trim().toUpperCase();
  if (iso in COUNTRY_TAX) return COUNTRY_TAX[iso];
  return DEFAULT_TAX_RATE;
}

export type CheckoutQuote = {
  planId: PlanId;
  currency: CheckoutCurrency;
  baseInr: number; // headline plan price (perNode × minNodes), in INR
  base: number; // plan price in the checkout currency
  discount: number; // discount amount in the checkout currency
  amount: number; // final charge, major value
  amountPaise: number; // final charge in the currency's smallest unit
  referralCode: string | null;
  // node pricing (the purchaser can add extra enforcement nodes)
  nodes: number; // total nodes chosen
  perNodeInr: number;
  subtotalInr: number; // base price for the chosen node count, pre-tax, pre-discount
  taxInr: number; // tax added on the discounted subtotal
  taxRate: number; // tax fraction applied
  // convenience: the tax-inclusive amount in INR (source of truth charged by razorpay)
  totalInr: number;
  billingCycle: BillingCycle;
};

// billing details collected on the checkout page and carried into the
// magic-link token so the payment step never re-asks for them.
export type BillingAddress = {
  email: string;
  firstName: string;
  lastName: string;
  phoneCode: string; // e.g. "+91"
  phone: string; // national number
    address1: string;
  address2: string;
  city: string;
  state: string;
  postal: string;
  country: string;
  company: string;
};

export const EMPTY_BILLING: BillingAddress = {
  email: "",
  firstName: "",
  lastName: "",
  phoneCode: "+91",
  phone: "",
    address1: "",
  address2: "",
  city: "",
  state: "",
  postal: "",
  country: "",
  company: "",
};

export function quoteCheckout(
  planId: PlanId,
  currency: CheckoutCurrency,
  referralCode: string | null | undefined,
  opts?: { nodes?: number; country?: string; billingCycle?: BillingCycle }
): CheckoutQuote {
  const pricing = PLAN_PRICING[planId];
  const perNodeInr = pricing.perNodeInr;
  const nodes = clampNodes(planId, opts?.nodes ?? pricing.minNodes);
  const billingCycle = opts?.billingCycle ?? "monthly";
  const cycleMultiplier = billingCycle === "yearly" ? 12 : 1;
  const cycleDiscount = billingCycle === "yearly" ? 0.08 : 0;
  let baseInr = perNodeInr * nodes * cycleMultiplier;
  if (cycleDiscount > 0) baseInr = Math.round(baseInr * (1 - cycleDiscount));
  const off = referralDiscount(referralCode);
  const code = off > 0 ? referralCode!.trim().toUpperCase() : null;
  const discount = off > 0 ? Math.round(baseInr * off) : 0;
  const taxable = Math.max(baseInr - discount, 0);
  const taxRate = taxRateForCountry(opts?.country);
  const taxInr = Math.round(taxable * taxRate);
  const totalInr = taxable + taxInr; // what razorpay actually charges (INR)
    // convert INR base → checkout currency via the static snapshot for display.
  // INR is the base, so it passes through unchanged; other currencies round.
  const rate = ratePerInrStatic(currency as CurrencyCode);
  const conv = (inr: number) =>
    currency === "INR" ? inr : Math.round((inr * rate) / 10) * 10;
  const base = conv(baseInr);
  const discountMajor = conv(discount);
  const amount = conv(totalInr);
  return {
    planId,
    currency,
    baseInr,
    base,
    discount: discountMajor,
    amount,
    amountPaise: amount * 100,
    referralCode: code,
    nodes,
    perNodeInr,
    subtotalInr: baseInr,
    taxInr,
    taxRate,
    totalInr,
    billingCycle,
  };
}