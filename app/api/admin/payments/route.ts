import { NextResponse } from "next/server";
import {
  ADMIN_EMAIL,
  checkIpBanStatus,
  getClientIp,
  logAdminAudit,
  verifyAdminMagicToken,
} from "@/lib/adminSecurity";
import {
  createManualPayment,
  getAllPayments,
} from "@/lib/adminStore";

export const dynamic = "force-dynamic";

function verifyAdminRequest(req: Request) {
  const ip = getClientIp(req);
  const banStatus = checkIpBanStatus(ip);
  if (banStatus.isBanned) {
    return { authorized: false, error: "IP is banned", status: 403 };
  }
  const token = req.headers.get("x-admin-token") || "";
  const email = req.headers.get("x-admin-email") || ADMIN_EMAIL;
  const valid = verifyAdminMagicToken(token, email);
  if (!valid.valid) {
    return { authorized: false, error: "Invalid/expired magic token", status: 401 };
  }
  return { authorized: true };
}

// GET /api/admin/payments - List all payments
export async function GET(request: Request) {
  const auth = verifyAdminRequest(request);
  if (!auth.authorized) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const payments = await getAllPayments();
  return NextResponse.json({ ok: true, payments, count: payments.length });
}

// POST /api/admin/payments - Create manual transaction / invoice credit
export async function POST(request: Request) {
  const auth = verifyAdminRequest(request);
  if (!auth.authorized) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const clientIp = getClientIp(request);
  const body = await request.json().catch(() => ({}));
  const userId = typeof body.userId === "string" ? body.userId : "";
  const email = typeof body.email === "string" ? body.email : "";
  const plan = typeof body.plan === "string" ? body.plan : "starter";
  const nodes = typeof body.nodes === "number" ? body.nodes : 1;
  const amountInr = typeof body.amountInr === "number" ? body.amountInr : 0;
  const status = (body.status as "paid" | "pending" | "refunded") || "paid";

  if (!userId || !email) {
    return NextResponse.json({ ok: false, error: "Missing userId or email" }, { status: 400 });
  }

  const rec = await createManualPayment({
    userId,
    email,
    plan,
    nodes,
    amountInr,
    status,
    razorpayOrderId: `manual_order_${Date.now()}`,
    razorpayPaymentId: `manual_pay_${Date.now()}`,
  });

  logAdminAudit({
    adminEmail: ADMIN_EMAIL,
    action: "CREATE_MANUAL_INVOICE",
    targetUserId: userId,
    details: `Issued manual credit of ₹${amountInr.toLocaleString("en-IN")} (${plan}, ${nodes} nodes) for ${email}`,
    ip: clientIp,
  });

  return NextResponse.json({ ok: true, payment: rec });
}
