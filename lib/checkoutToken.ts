import { createHmac, randomBytes } from "node:crypto";
import type { BillingAddress } from "@/lib/checkout";
import type { PlanId } from "@/lib/checkout";

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
  inr: number; // final charge in INR (tax-inclusive) — what razorpay charges
  referralCode: string | null;
  billing: BillingAddress;
  nonce: string;
  iat: number;
  exp: number;
    // pricing breakdown, locked at checkout-mint time so the payment page can
  // display (never recompute) the node count + tax that produced `inr`
  nodes: number;
  subtotalInr: number;
  discountInr: number;
  taxInr: number;
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
  referralCode: string | null;
  billing: BillingAddress;
  nodes: number;
  subtotalInr: number;
  discountInr: number;
  taxInr: number;
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
    // tolerate pre-node/tax tokens by defaulting the new fields
    return {
      ...c,
      nodes: Number(c.nodes) || 0,
      subtotalInr: Number(c.subtotalInr) || 0,
      taxInr: Number(c.taxInr) || 0,
      taxRate: Number(c.taxRate) || 0,
      billingCycle: (c.billingCycle as "monthly" | "yearly") ?? "monthly",
    };
  } catch {
    return null;
  }
}