import { NextResponse } from "next/server";
import {
  ADMIN_EMAIL,
  checkIpBanStatus,
  getAdminAuditLogs,
  getClientIp,
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

export async function GET(request: Request) {
  const auth = verifyAdminRequest(request);
  if (!auth.authorized) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const logs = getAdminAuditLogs();
  return NextResponse.json({ ok: true, logs });
}
