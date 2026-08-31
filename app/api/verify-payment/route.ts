import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  generateTransactionCrypto,
  encryptBillingAddress,
  logAuditEvent,
} from "@/lib/paymentEncryption";

// POST /api/verify-payment — razorpay standard checkout, step 3.
// HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET) must equal the
// razorpay_signature the checkout handed back. mismatch → 400, never paid.
//
// On verification success:
// 1. Generates D1 (32 bytes CSPRNG per transaction)
// 2. Computes E1 = AES-128-CBC(K1, IV, D1) and E2 = HMAC-SHA256(K2, D1)
// 3. Hashes E2 with bcrypt before DB storage
// 4. Zeroes D1 from memory immediately
// 5. Applies K3 field-level encryption to billing PII

export async function POST(request: Request) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json(
      { ok: false, error: "razorpay not configured" },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => null);
  const orderId = typeof body?.razorpay_order_id === "string" ? body.razorpay_order_id : "";
  const paymentId = typeof body?.razorpay_payment_id === "string" ? body.razorpay_payment_id : "";
  const signature = typeof body?.razorpay_signature === "string" ? body.razorpay_signature : "";
  const rawBilling = body?.billing && typeof body.billing === "object" ? body.billing : undefined;

  if (!orderId || !paymentId || !signature) {
    return NextResponse.json({ ok: false, error: "missing fields" }, { status: 400 });
  }

  const expected = createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  const valid = a.length === b.length && timingSafeEqual(a, b);

  if (!valid) {
    logAuditEvent("session_verification", {
      action: "payment_signature_verification",
      valid: false,
      orderId,
      paymentId,
    });
    return NextResponse.json({ ok: false, error: "signature mismatch" }, { status: 400 });
  }

  // Generate transaction crypto (D1 -> E1/E2 -> bcrypt hash of E2, zero D1)
  const cryptoResult = generateTransactionCrypto();

  // Field-level PII encryption for billing data using K3
  const encryptedBilling = rawBilling ? encryptBillingAddress(rawBilling) : undefined;

  logAuditEvent("session_verification", {
    action: "payment_signature_verification",
    valid: true,
    orderId,
    paymentId,
    keyVersion: cryptoResult.keyVersion,
    e2HashSnippet: cryptoResult.e2Hash.slice(0, 10),
  });

  return NextResponse.json({
    ok: true,
    orderId,
    paymentId,
    keyVersion: cryptoResult.keyVersion,
    e1: cryptoResult.e1,
    e2Hash: cryptoResult.e2Hash,
    iv: cryptoResult.iv,
    encryptedBilling,
  });
}