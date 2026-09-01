/**
 * Server-Side Entitlement Helper for CTFENCE
 * Single source of truth for plan verification across all Server Components and API Routes.
 */

import { getServerSubscription, PlanId, SubStatus } from "./entitlements";

export interface EntitlementResult {
  plan: PlanId;
  status: SubStatus;
  nodeCount: number;
  keyVersion: number;
}

/**
 * Returns user's active entitlement from subscriptions/{uid}.
 * Server-only; immune to client tampering.
 */
export async function getEntitlement(uid: string): Promise<EntitlementResult | null> {
  if (!uid) return null;
  try {
    const sub = await getServerSubscription(uid);
    return {
      plan: sub.plan,
      status: sub.status,
      nodeCount: sub.nodeCount,
      keyVersion: sub.version ?? 1,
    };
  } catch (err) {
    console.error("getEntitlement error:", err);
    return {
      plan: "free",
      status: "active",
      nodeCount: 1,
      keyVersion: 1,
    };
  }
}
