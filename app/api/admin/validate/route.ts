import { NextResponse } from "next/server";
import {
  ADMIN_EMAIL,
  checkIpBanStatus,
  getClientIp,
  getCurrentMagicPath,
  verifyAdminMagicToken,
} from "@/lib/adminSecurity";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip = getClientIp(request);

  // 1. IP Ban check
  const banStatus = checkIpBanStatus(ip);
  if (banStatus.isBanned) {
    return NextResponse.json(
      {
        ok: false,
        valid: false,
        banned: true,
        remainingSeconds: banStatus.remainingSeconds,
        error: `IP is banned. Try again in ${Math.ceil(banStatus.remainingSeconds / 60)} minutes.`,
      },
      { status: 403 }
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    // empty body is acceptable if checking cookie
  }

  const token =
    typeof body.token === "string"
      ? body.token
      : request.headers.get("x-admin-token") || "";

  const email =
    typeof body.email === "string"
      ? body.email.toLowerCase().trim()
      : ADMIN_EMAIL;

  const result = verifyAdminMagicToken(token, email);

  if (!result.valid) {
    return NextResponse.json(
      {
        ok: false,
        valid: false,
        error: "This admin magic link is invalid or has expired (10-minute temporary window expired). Please re-authenticate via the privacy page.",
      },
      { status: 401 }
    );
  }

  const currentMagic = getCurrentMagicPath();

  return NextResponse.json({
    ok: true,
    valid: true,
    adminEmail: ADMIN_EMAIL,
    expiresAt: result.expiresAt,
    remainingSeconds: result.remainingSeconds,
    currentMagicToken: currentMagic.token,
    currentMagicPath: currentMagic.path,
  });
}
