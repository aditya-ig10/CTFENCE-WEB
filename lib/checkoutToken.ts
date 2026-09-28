import { createHmac, randomBytes } from "node:crypto";
import type { BillingAddress, CheckoutCurrency } from "@/lib/checkout";
import type { PlanId } from "@/lib/checkout";
import { ratePerInrStatic, toMinorUnits } from "@/lib/currency";

// one-time checkout magic link — a signed, short-lived token that encodes
// the checkout intent (plan + email + amount + billing). server-only:
// imports node:crypto and reads RAZORPAY_KEY_SECRET. the create-order
// route requires this token, so the price billed is always the one minted at
// checkout time — never something the payment page sets itself.
//
// "one-time": token carries a random nonce and a 30-min expiry. true
// single-use revocation needs a store; without one, short lifespan + signed
// nonce are the practical bound (documented below).

export type CheckoutTokenClaims = {
  plan: PlanId;
  email: string;
  inr: number; // final charge in INR (tax-inclusive) — audit trail, not charged
  // settlement currency + amounts — what razorpay actually charges. locked at
  // mint time from the billing country so pricing and checkout always agree.
  currency: CheckoutCurrency;
  amount: number; // final charge in `currency`, major value
  amountMinor: number; // final charge in the currency's smallest unit
  referralCode: string | null;
  billing: BillingAddress;
  nonce: string;
  iat: number;
  exp: number;
    // pricing breakdown, locked at checkout-mint time so the payment step can
  // display (never recompute) the node count + tax that produced `amount`.
  // *Inr fields are the INR audit trail; subtotal/discount/tax are the same
  // figures in `currency` for display.
  nodes: number;
  subtotalInr: number;
  discountInr: number;
  taxInr: number;
  subtotal: number;
  discount: number;
  tax: number;
  taxRate: number;
  billingCycle?: "monthly" | "yearly";
};

const TTL_SECONDS = 30 * 60;

function b64(b: Buffer): string {
  return b.toString("base64url");
}

export function mintCheckoutToken(input: {
  plan: PlanId;
  email: string;
  inr: number; // total billed in INR (subtotal incl. discount + tax)
  currency: CheckoutCurrency;
  amount: number; // total billed in `currency`, major value
  amountMinor: number; // total billed in `currency`, smallest unit
  referralCode: string | null;
  billing: BillingAddress;
  nodes: number;
  subtotalInr: number;
  discountInr: number;
  taxInr: number;
  subtotal: number; // same breakdown in `currency`, for display
  discount: number;
  tax: number;
  taxRate: number;
  billingCycle?: "monthly" | "yearly";
}): { token: string; claims: CheckoutTokenClaims } {
  const secret = process.env.RAZORPAY_KEY_SECRET ?? "";
  const iat = Math.floor(Date.now() / 1000);
  const claims: CheckoutTokenClaims = {
    ...input,
    nonce: randomBytes(16).toString("hex"),
    iat,
    exp: iat + TTL_SECONDS,
  };
  const payload = b64(Buffer.from(JSON.stringify(claims), "utf8"));
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return { token: `${payload}.${sig}`, claims };
}

export function verifyCheckoutToken(token: string): CheckoutTokenClaims | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const secret = process.env.RAZORPAY_KEY_SECRET ?? "";
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  if (sig.length !== expected.length) return null;
  if (!Buffer.from(sig).equals(Buffer.from(expected))) return null;

  try {
    const raw = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!raw || typeof raw !== "object") return null;
    const c = raw as CheckoutTokenClaims;
    if (typeof c.exp !== "number" || Date.now() / 1000 > c.exp) return null;
    if (typeof c.inr !== "number" || typeof c.email !== "string" || !c.email) return null;
    if (!["starter", "teams"].includes(c.plan)) return null;
    if (!c.billing || typeof c.billing !== "object") return null;
    // tolerate pre-node/tax/currency tokens by defaulting the new fields.
    // old tokens were INR-only, so the charge-currency fields equal INR.
    const nodes = Number(c.nodes) || 0;
    const subtotalInr = Number(c.subtotalInr) || 0;
    const discountInr = Number((c as Partial<CheckoutTokenClaims>).discountInr) || 0;
    const taxInr = Number(c.taxInr) || 0;
    const currency = (typeof c.currency === "string" ? c.currency : "INR") as CheckoutCurrency;
    const rate = ratePerInrStatic(currency as Parameters<typeof ratePerInrStatic>[0]);
    const conv = (inr: number) => (currency === "INR" ? inr : Math.round(inr * rate));
    const amount =
      typeof c.amount === "number"
        ? c.amount
        : conv(typeof c.inr === "number" ? c.inr : 0);
    return {
      ...c,
      currency,
      amount,
      amountMinor:
        typeof c.amountMinor === "number"
          ? c.amountMinor
          : toMinorUnits(currency as Parameters<typeof toMinorUnits>[0], amount),
      nodes,
      subtotalInr,
      discountInr,
      taxInr,
      subtotal: typeof c.subtotal === "number" ? c.subtotal : conv(subtotalInr),
      discount: typeof c.discount === "number" ? c.discount : conv(discountInr),
      tax: typeof c.tax === "number" ? c.tax : conv(taxInr),
      taxRate: Number(c.taxRate) || 0,
      billingCycle: (c.billingCycle as "monthly" | "yearly") ?? "monthly",
    };
  } catch {
    return null;
  }
}