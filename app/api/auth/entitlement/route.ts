import { NextResponse } from "next/server";
import { getServerSubscription, issueEntitlementToken } from "@/lib/entitlements";

// POST /api/auth/entitlement — Issue signed entitlement claim for authenticated user
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const uid = typeof body?.uid === "string" ? body.uid : "";

  if (!uid) {
    return NextResponse.json({ ok: false, error: "Missing uid" }, { status: 400 });
  }

  // 1. Fetch server source of truth (subscriptions/{uid})
  const sub = await getServerSubscription(uid);

  // 2. Issue server-signed JWT
  const token = await issueEntitlementToken(sub.userId, sub.plan, sub.version, sub.status);

  // 3. Construct response with secure cookie
  const response = NextResponse.json({
    ok: true,
    token,
    plan: sub.plan,
    status: sub.status,
    nodeCount: sub.nodeCount,
    version: sub.version,
  });

  response.cookies.set({
    name: "cf_entitlement",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15, // 15 minutes (short-lived)
  });

  return response;
}

// DELETE /api/auth/entitlement — Clear entitlement cookie on logout
export async function DELETE() {
  const response = NextResponse.json({ ok: true, cleared: true });
  response.cookies.delete("cf_entitlement");
  return response;
}
