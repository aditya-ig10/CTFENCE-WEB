import { cookies } from "next/headers";
import { checkServerEntitlement, verifyEntitlementToken, type PlanId, type SubscriptionRecord } from "./entitlements";

export async function getServerAuthEntitlement(requiredPlan: PlanId): Promise<{
  isEntitled: boolean;
  actualPlan: PlanId;
  sub: SubscriptionRecord | null;
  reason?: string;
}> {
  const cookieStore = cookies();
  const token = cookieStore.get("cf_entitlement")?.value;

  if (!token) {
    return {
      isEntitled: false,
      actualPlan: "free",
      sub: null,
      reason: "No entitlement token provided",
    };
  }

  // 1. Verify token signature
  const payload = await verifyEntitlementToken(token);
  if (!payload || !payload.uid) {
    return {
      isEntitled: false,
      actualPlan: "free",
      sub: null,
      reason: "Invalid entitlement signature",
    };
  }

  // 2. Layer 2 re-check against server source of truth (subscriptions/{uid})
  const check = await checkServerEntitlement(payload.uid, requiredPlan, token);

  return {
    isEntitled: check.entitled,
    actualPlan: check.actualPlan,
    sub: {
      userId: payload.uid,
      plan: check.actualPlan,
      status: check.status,
      nodeCount: check.nodeCount,
      version: payload.version,
    },
    reason: check.reason,
  };
}
