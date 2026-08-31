import { NextResponse } from "next/server";
import { verifyCheckoutToken } from "@/lib/checkoutToken";

// POST /api/create-order — razorpay standard checkout, step 2.
// REQUIRES a valid one-time magic-link token. the amount, plan and currency
// all come from the token (minted server-side at checkout time); nothing about
// the price is trusted from the request body.
//
// Idempotency: uses claims.nonce in the receipt so that multiple attempts with
// the same token target the same unique receipt without duplicate billing risk.

const RAZORPAY_API = "https://api.razorpay.com/v1/orders";

export async function POST(request: Request) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return NextResponse.json(
      { ok: false, error: "razorpay not configured", code: "NOT_CONFIGURED" },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const claims = verifyCheckoutToken(token);
  if (!claims) {
    return NextResponse.json(
      { ok: false, error: "link invalid or expired — restart checkout", code: "TOKEN_EXPIRED" },
      { status: 410 }
    );
  }

  const amountPaise = Math.round(claims.inr * 100);
  if (amountPaise < 100) {
    return NextResponse.json(
      { ok: false, error: "amount below minimum", code: "AMOUNT_TOO_LOW" },
      { status: 400 }
    );
  }

  const receipt = `cf-${claims.plan}-${claims.nonce || Date.now()}`;

  let res: Response;
  try {
    res = await fetch(RAZORPAY_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt,
        notes: {
          plan: claims.plan,
          email: claims.email,
          referral_code: claims.referralCode ?? "",
          nonce: claims.nonce,
        },
      }),
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "razorpay unreachable", code: "GATEWAY_UNREACHABLE" },
      { status: 500 }
    );
  }

  if (res.status === 401) {
    console.error("razorpay auth failed — check RAZORPAY_KEY_ID/SECRET");
    return NextResponse.json(
      { ok: false, error: "razorpay auth failed", code: "AUTH_FAILED" },
      { status: 401 }
    );
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("razorpay order failed", res.status, text);
    return NextResponse.json(
      { ok: false, error: "order creation failed", code: `GATEWAY_ERROR_${res.status}` },
      { status: 500 }
    );
  }

  const order = (await res.json()) as { id: string; amount: number; currency: string };
  return NextResponse.json({
    ok: true,
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? keyId,
    planId: claims.plan,
    email: claims.email,
    nodes: claims.nodes,
  });
}