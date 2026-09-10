import { NextResponse } from "next/server";
import {
  ADMIN_EMAIL,
  checkIpBanStatus,
  getClientIp,
  getCurrentMagicPath,
  logAdminAudit,
  recordFailedAttempt,
  recordSuccessfulLogin,
  verifyAdminPassword,
} from "@/lib/adminSecurity";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const ip = getClientIp(request);

  // 1. IP Ban Enforcement Check
  const banStatus = checkIpBanStatus(ip);
  if (banStatus.isBanned) {
    return NextResponse.json(
      {
        ok: false,
        banned: true,
        remainingSeconds: banStatus.remainingSeconds,
        error: `ACCESS DENIED: Your IP (${ip}) is currently banned for 30 minutes due to 3 failed password attempts. Try again in ${Math.ceil(
          banStatus.remainingSeconds / 60
        )} minutes.`,
      },
      { status: 403 }
    );
  }

  // 2. Parse request payload
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  // 3. Email Check - ONLY ssynthrun@gmail.com is authorized
  if (email !== ADMIN_EMAIL.toLowerCase()) {
    logAdminAudit({
      adminEmail: email || "UNKNOWN",
      action: "UNAUTHORIZED_EMAIL_ATTEMPT",
      details: `Attempted login from unauthorized email '${email}' at IP ${ip}. Required: ${ADMIN_EMAIL}`,
      ip,
    });
    return NextResponse.json(
      {
        ok: false,
        error: `Access Denied: Only ${ADMIN_EMAIL} is authorized to access the root administration console.`,
      },
      { status: 403 }
    );
  }

  // 4. Password Verification
  const isPasswordValid = verifyAdminPassword(password);

  if (!isPasswordValid) {
    // Record failed attempt and check 3-strike rule
    const attemptResult = recordFailedAttempt(
      ip,
      `Failed admin password attempt with email ${email}`
    );

    if (attemptResult.isBanned) {
      logAdminAudit({
        adminEmail: email,
        action: "IP_LOCKOUT_TRIGGERED",
        details: `IP ${ip} entered 3 incorrect passwords. 30-minute lockdown enforced immediately.`,
        ip,
      });

      return NextResponse.json(
        {
          ok: false,
          banned: true,
          remainingSeconds: attemptResult.remainingSeconds,
          attemptsLeft: 0,
          error: "Too many failed attempts. Access locked for 30 minutes.",
        },
        { status: 403 }
      );
    }

    logAdminAudit({
      adminEmail: email,
      action: "INCORRECT_PASSWORD",
      details: `Incorrect password entered for ${email} from IP ${ip}. ${attemptResult.attemptsLeft} attempt(s) remaining before 30-min lockout.`,
      ip,
    });

    return NextResponse.json(
      {
        ok: false,
        banned: false,
        attemptsLeft: attemptResult.attemptsLeft,
        totalAttempts: attemptResult.totalAttempts,
        error: "Incorrect password.",
      },
      { status: 401 }
    );
  }

  // 5. Successful Authentication -> Clear IP attempts & issue 10-minute temporary magic token
  recordSuccessfulLogin(ip);

  const magic = getCurrentMagicPath();

  logAdminAudit({
    adminEmail: email,
    action: "ADMIN_LOGIN_SUCCESS",
    details: `Root authentication successful for ${email} from IP ${ip}. Issued 10-minute temporary magic token: ${magic.token}`,
    ip,
  });

  const response = NextResponse.json({
    ok: true,
    magicToken: magic.token,
    magicUrl: magic.path,
    expiresAt: magic.expiresAt,
    remainingSeconds: magic.remainingSeconds,
    message: "Admin authentication successful. Redirecting to 10-minute temporary magic link.",
  });

  // Set secure session cookie
  response.cookies.set({
    name: "cf_admin_token",
    value: magic.token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });

  return response;
}
