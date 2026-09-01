import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// ============================================================================
// Layer 1 Enforcement: Next.js Edge Middleware
// Fast UX reject & redirect before serving page bundles.
// (Real security boundary is Layer 2 Server Component + Layer 3 API Guard).
// ============================================================================

const ROUTE_REQUIREMENTS: Record<string, number> = {
  "/dashboard/siem": 2, // Teams
  "/dashboard/policy-code": 2, // Teams
  "/dashboard/approvals": 2, // Teams
  "/dashboard/fleet": 2, // Teams
  "/dashboard/rbac": 3, // Enterprise
  "/dashboard/policy-versions": 3, // Enterprise
  "/dashboard/compliance": 3, // Enterprise
  "/dashboard/sandbox": 3, // Enterprise
  "/dashboard/incident-replay": 3, // Enterprise
};

function getEntitlementSecret(): Uint8Array {
  const secret =
    process.env.ENTITLEMENT_SECRET ||
    process.env.RAZORPAY_KEY_SECRET ||
    "cf-dev-entitlement-secret-2026-strict-key";
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Find if current path is a gated dashboard route
  const matchingPrefix = Object.keys(ROUTE_REQUIREMENTS).find(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (!matchingPrefix) {
    return NextResponse.next();
  }

  const requiredLevel = ROUTE_REQUIREMENTS[matchingPrefix];
  const token = request.cookies.get("cf_entitlement")?.value;

  if (!token) {
    // Fast UX redirect to checkout/upgrade
    const targetPlan = requiredLevel === 3 ? "enterprise" : "teams";
    const upgradeUrl = new URL(`/checkout?plan=${targetPlan}&returnUrl=${encodeURIComponent(pathname)}`, request.url);
    return NextResponse.redirect(upgradeUrl);
  }

  try {
    const secret = getEntitlementSecret();
    const { payload } = await jwtVerify(token, secret, {
      issuer: "contextfence.dev",
      audience: "contextfence-app",
    });

    const level = Number(payload.level ?? 0);
    const status = String(payload.status ?? "");

    if (status !== "active" && status !== "trialing") {
      const upgradeUrl = new URL(`/checkout?plan=teams&status=${status}`, request.url);
      return NextResponse.redirect(upgradeUrl);
    }

    if (level < requiredLevel) {
      const targetPlan = requiredLevel === 3 ? "enterprise" : "teams";
      const upgradeUrl = new URL(`/checkout?plan=${targetPlan}&returnUrl=${encodeURIComponent(pathname)}`, request.url);
      return NextResponse.redirect(upgradeUrl);
    }

    return NextResponse.next();
  } catch {
    // Forged, malformed, or expired token -> Fast UX redirect
    const targetPlan = requiredLevel === 3 ? "enterprise" : "teams";
    const upgradeUrl = new URL(`/checkout?plan=${targetPlan}&error=invalid_session`, request.url);
    return NextResponse.redirect(upgradeUrl);
  }
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
