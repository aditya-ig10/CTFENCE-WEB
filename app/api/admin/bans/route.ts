import { NextResponse } from "next/server";
import {
  ADMIN_EMAIL,
  banIpManually,
  checkIpBanStatus,
  getAllBans,
  getClientIp,
  logAdminAudit,
  unbanIp,
  verifyAdminMagicToken,
} from "@/lib/adminSecurity";

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

// GET /api/admin/bans - List all active bans and lockout attempts
export async function GET(request: Request) {
  const auth = verifyAdminRequest(request);
  if (!auth.authorized) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const bans = getAllBans();
  return NextResponse.json({ ok: true, bans });
}

// POST /api/admin/bans - Manually ban an IP
export async function POST(request: Request) {
  const auth = verifyAdminRequest(request);
  if (!auth.authorized) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const clientIp = getClientIp(request);
  const body = await request.json().catch(() => ({}));
  const targetIp = typeof body.ip === "string" ? body.ip.trim() : "";
  const durationMinutes = typeof body.durationMinutes === "number" ? body.durationMinutes : 30;
  const reason = typeof body.reason === "string" ? body.reason : "Manual ban by admin";

  if (!targetIp) {
    return NextResponse.json({ ok: false, error: "Missing IP to ban" }, { status: 400 });
  }

  banIpManually(targetIp, durationMinutes, reason);

  logAdminAudit({
    adminEmail: ADMIN_EMAIL,
    action: "MANUAL_IP_BAN",
    details: `Manually banned IP ${targetIp} for ${durationMinutes} minutes. Reason: ${reason}`,
    ip: clientIp,
  });

  return NextResponse.json({
    ok: true,
    message: `IP ${targetIp} banned for ${durationMinutes} minutes.`,
    bans: getAllBans(),
  });
}

// DELETE /api/admin/bans - Unban an IP
export async function DELETE(request: Request) {
  const auth = verifyAdminRequest(request);
  if (!auth.authorized) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const clientIp = getClientIp(request);
  const { searchParams } = new URL(request.url);
  const targetIp = searchParams.get("ip");

  if (!targetIp) {
    return NextResponse.json({ ok: false, error: "Missing IP query parameter" }, { status: 400 });
  }

  unbanIp(targetIp);

  logAdminAudit({
    adminEmail: ADMIN_EMAIL,
    action: "MANUAL_IP_UNBAN",
    details: `Unbanned IP ${targetIp}`,
    ip: clientIp,
  });

  return NextResponse.json({
    ok: true,
    message: `IP ${targetIp} has been unbanned.`,
    bans: getAllBans(),
  });
}
