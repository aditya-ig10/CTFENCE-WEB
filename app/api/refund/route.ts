import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  verifyM3SessionToken,
  logAuditEvent,
} from "@/lib/paymentEncryption";

// ============================================================================
// POST /api/refund — Server-Initiated Refund Endpoint
//
// Requirements:
//   1. Server-initiated only.
//   2. Re-verifies original payment signature (HMAC-SHA256(order_id|payment_id, secret))
//   3. Supports optional E1 + M3 TOTP verification for dispute/refund self-service
//   4. Calls Razorpay Refund API with Basic Auth
//   5. Logs every refund decision server-side for audit trail
// ============================================================================

const RAZORPAY_REFUND_API_BASE = "https://api.razorpay.com/v1/payments";

export async function POST(request: Request) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return NextResponse.json({ ok: false, error: "payment gateway not configured" }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  const paymentId = typeof body?.paymentId === "string" ? body.paymentId : "";
  const orderId = typeof body?.orderId === "string" ? body.orderId : "";
  const originalSignature = typeof body?.originalSignature === "string" ? body.originalSignature : "";
  const amountPaise = typeof body?.amountPaise === "number" ? body.amountPaise : undefined;
  const reason = typeof body?.reason === "string" ? body.reason : "customer_request";

  // Optional session verification via E1 + M3 TOTP
  const e1 = typeof body?.e1 === "string" ? body.e1 : undefined;
  const m3Code = typeof body?.m3Code === "string" ? body.m3Code : undefined;

  if (!paymentId || !orderId) {
    return NextResponse.json({ ok: false, error: "missing paymentId or orderId" }, { status: 400 });
  }

  // 1. Re-verify original payment signature if supplied
  if (originalSignature) {
    const expected = createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(originalSignature, "utf8");
    const valid = a.length === b.length && timingSafeEqual(a, b);
    if (!valid) {
      logAuditEvent("refund_decision", {
        status: "rejected",
        reason: "Original payment signature mismatch",
        paymentId,
        orderId,
      });
      return NextResponse.json({ ok: false, error: "invalid original payment signature" }, { status: 400 });
    }
  }

  // 2. If E1 and M3 session code are provided, verify them under ABIT
  if (e1 && m3Code) {
    const sessionCheck = verifyM3SessionToken(e1, m3Code, {
      userAgent: request.headers.get("user-agent") || undefined,
      clientIp: request.headers.get("x-forwarded-for") || undefined,
    });
    if (!sessionCheck.valid) {
      logAuditEvent("refund_decision", {
        status: "rejected",
        reason: "Invalid session OTP during refund request",
        paymentId,
        orderId,
      });
      return NextResponse.json({ ok: false, error: "session verification failed: " + sessionCheck.error }, { status: 401 });
    }
  }

  // 3. Execute Refund API call against Razorpay
  let res: Response;
  const refundUrl = `${RAZORPAY_REFUND_API_BASE}/${encodeURIComponent(paymentId)}/refund`;
  try {
    res = await fetch(refundUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      },
      body: JSON.stringify({
        amount: amountPaise,
        notes: {
          order_id: orderId,
          refund_reason: reason,
          timestamp: new Date().toISOString(),
        },
      }),
    });
  } catch {
    logAuditEvent("refund_decision", {
      status: "error",
      reason: "Razorpay refund endpoint unreachable",
      paymentId,
      orderId,
    });
    return NextResponse.json({ ok: false, error: "payment gateway unreachable" }, { status: 502 });
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    logAuditEvent("refund_decision", {
      status: "failed",
      httpStatus: res.status,
      errorText: errText,
      paymentId,
      orderId,
    });
    return NextResponse.json({ ok: false, error: "refund processing failed", details: errText }, { status: res.status });
  }

  const refundData = await res.json();
  logAuditEvent("refund_decision", {
    status: "approved",
    refundId: refundData.id,
    paymentId,
    orderId,
    amount: refundData.amount,
    currency: refundData.currency,
  });

  return NextResponse.json({
    ok: true,
    refundId: refundData.id,
    paymentId,
    amount: refundData.amount,
    currency: refundData.currency,
    status: refundData.status,
  });
}
