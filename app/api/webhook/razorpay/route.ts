import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  generateTransactionCrypto,
  encryptBillingAddress,
  logAuditEvent,
} from "@/lib/paymentEncryption";
import { setServerSubscription, type PlanId } from "@/lib/entitlements";

// ============================================================================
// POST /api/webhook/razorpay — Server-to-server Razorpay Webhook Handler
//
// Security Requirements:
//   1. Must verify HMAC-SHA256(raw_payload, RAZORPAY_WEBHOOK_SECRET) with constant-time equality
//   2. Must reject untrusted or unverified payloads prior to DB access
//   3. On payment capture: generate D1 CSPRNG, derive E1/E2, hash E2 with bcrypt,
//      zero D1 from memory, encrypt billing PII with K3.
//   4. Updates single source of truth in `subscriptions/{uid}` doc with version bump.
//   5. On cancellation/refund/downgrade: immediately writes `free`/`canceled` with version bump,
//      instantly revoking all client entitlement tokens.
//   6. Log all webhook events for audit inspection.
// ============================================================================

export async function POST(request: Request) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
  if (!webhookSecret) {
    console.error("Razorpay webhook secret not configured");
    return NextResponse.json({ ok: false, error: "webhook not configured" }, { status: 500 });
  }

  const signature = request.headers.get("x-razorpay-signature") || "";
  if (!signature) {
    return NextResponse.json({ ok: false, error: "missing signature" }, { status: 400 });
  }

  // Read raw payload text for signature verification
  const rawBody = await request.text().catch(() => "");
  if (!rawBody) {
    return NextResponse.json({ ok: false, error: "empty body" }, { status: 400 });
  }

  // 1. Constant-time signature verification
  const expectedSignature = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
  const a = Buffer.from(expectedSignature, "utf8");
  const b = Buffer.from(signature, "utf8");
  const isValid = a.length === b.length && timingSafeEqual(a, b);

  if (!isValid) {
    logAuditEvent("risk_assessment", {
      event: "webhook_signature_mismatch",
      signatureReceivedSnippet: signature.slice(0, 10),
    });
    return NextResponse.json({ ok: false, error: "signature verification failed" }, { status: 400 });
  }

  // Parse verified JSON
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const event = typeof payload.event === "string" ? payload.event : "unknown";
  logAuditEvent("risk_assessment", { event: `webhook_${event}`, timestamp: Date.now() });

  const paymentEntity = (payload.payload as Record<string, unknown>)?.payment as Record<string, unknown> | undefined;
  const entity = (paymentEntity?.entity as Record<string, unknown>) || {};
  const paymentId = (entity.id as string) || "";
  const orderId = (entity.order_id as string) || "";
  const notes = (entity.notes as Record<string, unknown>) || {};
  const email = (entity.email as string) || (notes.email as string) || "";
  const userId = (notes.userId as string) || (notes.uid as string) || "";
  const plan = ((notes.plan as string) || "starter") as PlanId;
  const nodeCount = Number(notes.nodes || notes.nodeCount || 1);

  // Generate transaction crypto (D1 -> E1/E2 -> bcrypt hash, D1 zeroed)
  const cryptoResult = generateTransactionCrypto();

  // Handle payment success events
  if (event === "payment.captured" || event === "order.paid") {
    // 1. Write server-only source of truth in subscriptions/{uid}
    if (userId) {
      await setServerSubscription(userId, plan, "active", nodeCount, cryptoResult.keyVersion).catch((err) => {
        console.error("Failed to update server subscription via webhook:", err);
      });
    }

    // 2. Field-level PII encryption for customer details
    const encryptedBilling = encryptBillingAddress({
      email,
      notes: JSON.stringify(notes),
    });

    logAuditEvent("session_verification", {
      action: "webhook_payment_encrypted",
      paymentId,
      orderId,
      userId,
      plan,
      keyVersion: cryptoResult.keyVersion,
      e2HashSnippet: cryptoResult.e2Hash.slice(0, 10),
      encryptedBillingFieldCount: Object.keys(encryptedBilling).length,
    });

    return NextResponse.json({
      ok: true,
      processed: true,
      event,
      paymentId,
      keyVersion: cryptoResult.keyVersion,
    });
  }

  // Handle cancellation / refund / failure events (Instant token revocation)
  if (
    event === "payment.failed" ||
    event === "refund.created" ||
    event === "subscription.cancelled" ||
    event === "subscription.halted"
  ) {
    if (userId) {
      await setServerSubscription(userId, "free", "canceled", 1, cryptoResult.keyVersion).catch((err) => {
        console.error("Failed to revoke server subscription via webhook:", err);
      });
    }

    logAuditEvent("session_verification", {
      action: "webhook_subscription_revoked",
      event,
      userId,
      paymentId,
    });

    return NextResponse.json({
      ok: true,
      processed: true,
      event,
      revoked: true,
      userId,
    });
  }

  return NextResponse.json({ ok: true, processed: true, event });
}
