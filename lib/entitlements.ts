import { SignJWT, jwtVerify } from "jose";
import { getFirebaseDb } from "@/lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

export type PlanId = "free" | "starter" | "teams" | "enterprise";
export type SubStatus = "active" | "past_due" | "canceled" | "trialing";

export const PLAN_LEVELS: Record<PlanId, number> = {
  free: 0,
  starter: 1,
  teams: 2,
  enterprise: 3,
};

export interface SubscriptionRecord {
  userId: string;
  plan: PlanId;
  status: SubStatus;
  nodeCount: number;
  version: number;
  keyVersion?: string;
  updatedAt?: unknown;
  expiresAt?: unknown;
}

export interface EntitlementPayload {
  uid: string;
  plan: PlanId;
  version: number;
  status: SubStatus;
  level: number;
}

// ----------------------------------------------------------------------------
// Secret Key for Entitlement Token Signing (HMAC-SHA256)
// ----------------------------------------------------------------------------
function getEntitlementSecret(): Uint8Array {
  const secret =
    process.env.ENTITLEMENT_SECRET ||
    process.env.RAZORPAY_KEY_SECRET ||
    "cf-dev-entitlement-secret-2026-strict-key";
  return new TextEncoder().encode(secret);
}

/**
 * Issue a signed, short-lived (15 min) entitlement JWT
 */
export async function issueEntitlementToken(
  uid: string,
  plan: PlanId,
  version: number,
  status: SubStatus = "active"
): Promise<string> {
  const secret = getEntitlementSecret();
  const level = PLAN_LEVELS[plan] ?? 0;

  return await new SignJWT({
    uid,
    plan,
    version,
    status,
    level,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("contextfence.dev")
    .setAudience("contextfence-app")
    .setExpirationTime("15m")
    .sign(secret);
}

/**
 * Verifies the signature and expiration of an entitlement token
 */
export async function verifyEntitlementToken(token: string): Promise<EntitlementPayload | null> {
  if (!token) return null;
  try {
    const secret = getEntitlementSecret();
    const { payload } = await jwtVerify(token, secret, {
      issuer: "contextfence.dev",
      audience: "contextfence-app",
    });

    return {
      uid: String(payload.uid),
      plan: (payload.plan as PlanId) || "free",
      version: Number(payload.version ?? 1),
      status: (payload.status as SubStatus) || "active",
      level: Number(payload.level ?? 0),
    };
  } catch {
    return null;
  }
}

const MEMORY_SUBSCRIPTION_STORE = new Map<string, SubscriptionRecord>();

/**
 * Server-Side Source of Truth Verification (Layer 2 & Layer 3)
 * Fetches subscriptions/{uid} directly from database.
 * Completely immune to client-side tampering.
 */
export async function getServerSubscription(uid: string): Promise<SubscriptionRecord> {
  if (!uid) {
    return {
      userId: "",
      plan: "free",
      status: "active",
      nodeCount: 1,
      version: 1,
    };
  }

  if (MEMORY_SUBSCRIPTION_STORE.has(uid)) {
    return MEMORY_SUBSCRIPTION_STORE.get(uid)!;
  }

  try {
    const db = getFirebaseDb();
    if (db) {
      // 1. Primary check: Server-only subscriptions collection
      const subSnap = await getDoc(doc(db, "subscriptions", uid));
      if (subSnap.exists()) {
        const data = subSnap.data() as SubscriptionRecord;
        const rec: SubscriptionRecord = {
          userId: uid,
          plan: data.plan || "free",
          status: data.status || "active",
          nodeCount: typeof data.nodeCount === "number" ? data.nodeCount : 1,
          version: typeof data.version === "number" ? data.version : 1,
          keyVersion: data.keyVersion,
          updatedAt: data.updatedAt,
          expiresAt: data.expiresAt,
        };
        MEMORY_SUBSCRIPTION_STORE.set(uid, rec);
        return rec;
      }

      // 2. Fallback check: verified users collection
      const userSnap = await getDoc(doc(db, "users", uid));
      if (userSnap.exists()) {
        const uData = userSnap.data();
        const plan = (uData.plan as PlanId) || "free";
        const nodes = typeof uData.nodes === "number" ? uData.nodes : 1;
        const rec: SubscriptionRecord = {
          userId: uid,
          plan,
          status: "active",
          nodeCount: nodes,
          version: 1,
        };
        MEMORY_SUBSCRIPTION_STORE.set(uid, rec);
        return rec;
      }
    }
  } catch (err) {
    console.error("Error fetching server subscription:", err);
  }

  // Default unprivileged fallback
  const fallback: SubscriptionRecord = {
    userId: uid,
    plan: "free",
    status: "active",
    nodeCount: 1,
    version: 1,
  };
  MEMORY_SUBSCRIPTION_STORE.set(uid, fallback);
  return fallback;
}

/**
 * Server-Side Gate Check with Version Invalidation
 * Verifies:
 * 1. Plan level meets or exceeds required plan
 * 2. Subscription status is active
 * 3. Token version matches current server version (closes downgrade window)
 */
export async function checkServerEntitlement(
  uid: string,
  requiredPlan: PlanId,
  providedToken?: string | null
): Promise<{
  entitled: boolean;
  actualPlan: PlanId;
  requiredPlan: PlanId;
  nodeCount: number;
  status: SubStatus;
  reason?: string;
}> {
  const sub = await getServerSubscription(uid);
  const requiredLevel = PLAN_LEVELS[requiredPlan] ?? 0;
  const actualLevel = PLAN_LEVELS[sub.plan] ?? 0;

  if (sub.status !== "active" && sub.status !== "trialing") {
    return {
      entitled: false,
      actualPlan: sub.plan,
      requiredPlan,
      nodeCount: sub.nodeCount,
      status: sub.status,
      reason: `Subscription is ${sub.status}`,
    };
  }

  if (actualLevel < requiredLevel) {
    return {
      entitled: false,
      actualPlan: sub.plan,
      requiredPlan,
      nodeCount: sub.nodeCount,
      status: sub.status,
      reason: `Requires ${requiredPlan.toUpperCase()} tier (current: ${sub.plan.toUpperCase()})`,
    };
  }

  // If a client token was provided, ensure it hasn't been invalidated by a version bump
  if (providedToken) {
    const payload = await verifyEntitlementToken(providedToken);
    if (!payload || payload.version < sub.version) {
      return {
        entitled: false,
        actualPlan: sub.plan,
        requiredPlan,
        nodeCount: sub.nodeCount,
        status: sub.status,
        reason: "Entitlement token version is stale or revoked",
      };
    }
  }

  return {
    entitled: true,
    actualPlan: sub.plan,
    requiredPlan,
    nodeCount: sub.nodeCount,
    status: sub.status,
  };
}

/**
 * Server-Side Downgrade / Invalidation Handler
 * Increments the version counter in subscriptions/{uid} so all outstanding tokens are revoked immediately.
 */
export async function setServerSubscription(
  uid: string,
  plan: PlanId,
  status: SubStatus,
  nodeCount = 1,
  keyVersion = "v1"
): Promise<SubscriptionRecord> {
  const current = await getServerSubscription(uid);
  const nextVersion = (current.version || 1) + 1;

  const newSub: SubscriptionRecord = {
    userId: uid,
    plan,
    status,
    nodeCount,
    version: nextVersion,
    keyVersion,
    updatedAt: new Date().toISOString(),
  };

  MEMORY_SUBSCRIPTION_STORE.set(uid, newSub);

  const db = getFirebaseDb();
  if (db) {
    await setDoc(
      doc(db, "subscriptions", uid),
      {
        ...newSub,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  return newSub;
}
