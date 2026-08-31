import { NextResponse } from "next/server";
import {
  isPlanId,
  quoteCheckout,
  clampNodes,
  PLAN_PRICING,
  referralDiscount,
  taxRateForCountry,
  type BillingAddress,
} from "@/lib/checkout";
import { mintCheckoutToken } from "@/lib/checkoutToken";

// POST /api/checkout-link — step 1 of the magic-link flow. given a plan,
// email+billing from the form, and the chosen node count, it mints a signed
// one-time token (30min expiry) carrying the tax-inclusive total and emails the
// "pay here" magic link. returns the token+link so the page can also continue
// inline when email delivery is off. the amount, nodes and tax are all
// recomputed server-side from the plan + referral + billing country — never
// trusted from the request body.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export async function POST(request: Request) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json({ ok: false, error: "not configured" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const plan = body?.plan;
  const referralCode = typeof body?.referralCode === "string" ? body.referralCode : null;
  const billing = body?.billing as Partial<BillingAddress> | null;
  const email = typeof billing?.email === "string" ? billing.email.trim().toLowerCase() : "";
  const country = typeof billing?.country === "string" ? billing.country : null;
  const billingCycle = body?.billingCycle === "yearly" ? "yearly" as const : "monthly" as const;

  if (!isPlanId(plan)) {
    return NextResponse.json({ ok: false, error: "unknown plan" }, { status: 400 });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: "enter a valid email" }, { status: 400 });
  }

  // handle add-on vs full purchase: addNodes = buy extra nodes only (at per-node price), not the full plan
  const addNodesRaw = typeof body?.addNodes === "number" ? body.addNodes : NaN;
  const isAddOn = Number.isFinite(addNodesRaw) && addNodesRaw > 0;
  let nodes: number;
  let quote: ReturnType<typeof quoteCheckout>;
  if (isAddOn) {
    const maxAdd = Math.max(PLAN_PRICING[plan].maxNodes - PLAN_PRICING[plan].minNodes, 1);
    const addNodes = Math.min(Math.max(Math.round(addNodesRaw), 1), maxAdd);
    nodes = addNodes;
    const perNodeInr = PLAN_PRICING[plan].perNodeInr;
    const cycleMul = billingCycle === "yearly" ? 12 : 1;
    const cycleDisc = billingCycle === "yearly" ? 0.08 : 0;
    let baseInr = perNodeInr * addNodes * cycleMul;
    if (cycleDisc > 0) baseInr = Math.round(baseInr * (1 - cycleDisc));
    const off = referralDiscount(referralCode);
    const code = off > 0 ? (referralCode as string).toUpperCase() : null;
    const discount = off > 0 ? Math.round(baseInr * off) : 0;
    const taxable = Math.max(baseInr - discount, 0);
    const taxRate = taxRateForCountry(country || undefined);
    const taxInr = Math.round(taxable * taxRate);
    const totalInr = taxable + taxInr;
    quote = {
      planId: plan,
      currency: "INR",
      baseInr,
      base: baseInr,
      discount,
      amount: totalInr,
      amountPaise: totalInr * 100,
      referralCode: code,
      nodes: addNodes,
      perNodeInr,
      subtotalInr: baseInr,
      taxInr,
      taxRate,
      totalInr,
      billingCycle,
    } as ReturnType<typeof quoteCheckout>;
  } else {
    const requested = typeof body?.nodes === "number" ? body.nodes : NaN;
    nodes = Number.isFinite(requested) ? clampNodes(plan, requested) : PLAN_PRICING[plan].minNodes;
    quote = quoteCheckout(plan, "INR", referralCode, {
      nodes,
      country: country || undefined,
      billingCycle,
    });
  }
  const { token, claims } = mintCheckoutToken({
    plan,
    email,
    inr: quote.totalInr,
    referralCode: quote.referralCode,
        billing: {
      email,
      firstName: billing?.firstName ?? "",
      lastName: billing?.lastName ?? "",
      phoneCode: billing?.phoneCode ?? "+91",
      phone: billing?.phone ?? "",
      address1: billing?.address1 ?? "",
      address2: billing?.address2 ?? "",
      city: billing?.city ?? "",
      state: billing?.state ?? "",
      postal: billing?.postal ?? "",
      country: billing?.country ?? "",
      company: billing?.company ?? "",
    },
        nodes: quote.nodes,
    subtotalInr: quote.subtotalInr,
    discountInr: quote.discount,
    taxInr: quote.taxInr,
    taxRate: quote.taxRate,
    billingCycle,
  });

  const link = `${BASE}/checkout/confirm?t=${encodeURIComponent(token)}`;

  // best-effort email via emailjs; when keys are absent the inbound link still works
  if (process.env.EMAILJS_PUBLIC_KEY) {
    void fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: process.env.EMAILJS_SERVICE_ID ?? "service_7ryyk2d",
        template_id: process.env.EMAILJS_TEMPLATE_REPLY ?? "template_m2an2mn",
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        accessToken: process.env.EMAILJS_PRIVATE_KEY || undefined,
        template_params: {
          to_email: email,
          plan: claims.plan,
          nodes: claims.nodes,
          amount: `₹${claims.inr.toLocaleString("en-IN")}`,
          checkout_url: link,
          date: new Date().toISOString().slice(0, 16).replace("T", " "),
        },
      }),
    }).catch(() => {
      // best-effort — ignoring email failures here keeps checkout resilient
    });
  }

  return NextResponse.json({
    ok: true,
    token,
    link,
    amount: claims.inr,
    nodes: claims.nodes,
    taxInr: claims.taxInr,
    taxRate: claims.taxRate,
    expiresIn: 30 * 60,
    });
}

