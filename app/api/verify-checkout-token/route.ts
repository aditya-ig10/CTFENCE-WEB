import { NextResponse } from "next/server";
import { verifyCheckoutToken } from "@/lib/checkoutToken";

// POST /api/verify-checkout-token — validates a magic-link token and returns
// the checkout intent it carries (plan, amount, email, billing). the payment
// step uses the amount baked into this token; nothing is re-derived from input.

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  if (!token) return NextResponse.json({ ok: false, error: "missing token" }, { status: 400 });

  const claims = verifyCheckoutToken(token);
  if (!claims) {
    return NextResponse.json({ ok: false, error: "link invalid or expired" }, { status: 410 });
  }

    return NextResponse.json({
    ok: true,
    token,
    plan: claims.plan,
    email: claims.email,
    amount: claims.amount, // tax-inclusive total in `currency` that razorpay charges
    currency: claims.currency,
    amountInr: claims.inr, // same total in INR (audit trail)
    referralCode: claims.referralCode,
    billing: claims.billing,
        nodes: claims.nodes,
    subtotal: claims.subtotal,
    discount: claims.discount,
    tax: claims.tax,
    subtotalInr: claims.subtotalInr,
    discountInr: claims.discountInr ?? 0,
    taxInr: claims.taxInr,
    taxRate: claims.taxRate,
  });
}