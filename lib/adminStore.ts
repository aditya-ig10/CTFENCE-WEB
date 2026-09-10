import { getAdminDb } from "@/lib/firebaseAdmin";
// Server-side admin data layer — uses the Firebase Admin SDK (bypasses
// firestore.rules). Do NOT use the client SDK (lib/firebase) here: API routes
// run unauthenticated and rules deny all reads, which previously made the
// admin panel show zero users despite data existing in Firestore.
import { FieldValue } from "firebase-admin/firestore";

const serverTimestamp = () => FieldValue.serverTimestamp();

export interface AdminUserRecord {
  id: string; // uid
  uid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  photoURL?: string;
  company?: string;
  phoneNumber?: string;
  phoneDial?: string;
  plan: "free" | "starter" | "teams" | "enterprise";
  status: "active" | "past_due" | "canceled" | "trialing" | "banned";
  nodes: number;
  nodeLimit?: number;
  expiresAt?: string | null;
  planPurchasedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  isBanned?: boolean;
  adminNotes?: string;
  tags?: string[];
  totalSpendInr?: number;
  transactionsCount?: number;
  assignedNodes?: AdminFleetNode[];
}

export interface AdminFleetNode {
  id: string; // doc id
  nodeId: string;
  userId: string;
  name: string;
  region: string;
  host: string;
  port: number;
  status: "online" | "offline" | "maintenance" | "syncing";
  version: string;
  latencyMs: number;
  cpuUsage: number;
  memoryUsage: number;
  token: string;
  policyMode: "strict" | "adaptive" | "permissive";
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminPaymentRecord {
  id: string;
  userId: string;
  email: string;
  plan: string;
  nodes: number;
  amountInr: number;
  status: "paid" | "pending" | "failed" | "refunded";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  billing?: Record<string, unknown>;
  createdAt?: string;
  expiresAt?: string;
}

// In-memory cache for fast synchronous rendering and offline resilience
const LIVE_USERS_CACHE: Map<string, AdminUserRecord> = new Map();
const LIVE_NODES_CACHE: Map<string, AdminFleetNode> = new Map();
const LIVE_PAYMENTS_CACHE: Map<string, AdminPaymentRecord> = new Map();

function parseTimestamp(raw: unknown): string | null {
  if (!raw) return null;
  if (typeof raw === "object" && raw !== null && "toDate" in raw && typeof (raw as { toDate?: unknown }).toDate === "function") {
    try {
      return (raw as { toDate: () => Date }).toDate().toISOString();
    } catch {
      return null;
    }
  }
  if (typeof raw === "string" || typeof raw === "number") {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d.toISOString();
  }
  return null;
}

async function withTimeout<T>(promise: Promise<T>, ms = 3500): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

/**
 * Fetch ALL real users directly from Firestore `users` and `subscriptions`
 */
export async function getAllUsers(): Promise<AdminUserRecord[]> {
  const usersMap = new Map<string, AdminUserRecord>();

  try {
    const db = getAdminDb();
    if (db) {
      const snap = await withTimeout(db.collection("users").get(), 4000);
      if (snap && snap.docs) {
        for (const d of snap.docs) {
          const data = d.data() as Record<string, unknown>;
          const uid = d.id;
          const email = String(data.email || "");

          const expStr = parseTimestamp(data.expiresAt);
          const planPurchasedStr = parseTimestamp(data.planPurchasedAt || data.createdAt);

          const rec: AdminUserRecord = {
            id: uid,
            uid,
            email: email || "unknown@user.com",
            firstName: String(data.firstName || ""),
            lastName: String(data.lastName || ""),
            photoURL: String(data.photoURL || ""),
            company: String(data.company || ""),
            phoneNumber: String(data.phoneNumber || ""),
            phoneDial: String(data.phoneDial || "IN +91"),
            plan: (data.plan as AdminUserRecord["plan"]) || "free",
            status: (data.status as AdminUserRecord["status"]) || "active",
            nodes: Number(data.nodes ?? 1),
            nodeLimit: Number(data.nodeLimit ?? data.nodes ?? 1),
            expiresAt: expStr,
            planPurchasedAt: planPurchasedStr,
            createdAt: parseTimestamp(data.createdAt) || new Date().toISOString(),
            updatedAt: parseTimestamp(data.updatedAt) || undefined,
            isBanned: Boolean(data.isBanned ?? false),
            adminNotes: String(data.adminNotes || ""),
            tags: Array.isArray(data.tags) ? data.tags : [],
          };

          usersMap.set(uid, rec);
          LIVE_USERS_CACHE.set(uid, rec);
        }
      }

      // Check subscriptions
      try {
        const subSnap = await withTimeout(db.collection("subscriptions").get(), 3000);
        if (subSnap && subSnap.docs) {
          for (const sd of subSnap.docs) {
            const sdata = sd.data() as Record<string, unknown>;
            const suid = sd.id;
            const existing = usersMap.get(suid);
            if (existing) {
              existing.plan = (sdata.plan as AdminUserRecord["plan"]) || existing.plan;
              existing.status = (sdata.status as AdminUserRecord["status"]) || existing.status;
              if (typeof sdata.nodeCount === "number") {
                existing.nodes = sdata.nodeCount;
                existing.nodeLimit = sdata.nodeCount;
              }
              if (sdata.expiresAt) {
                existing.expiresAt = parseTimestamp(sdata.expiresAt) || existing.expiresAt;
              }
            }
          }
        }
      } catch {}
    }
  } catch (err) {
    console.error("Admin getAllUsers: Firestore users query failed:", err);
    if (err instanceof Error && /permission/i.test(err.message)) {
      console.error(
        "Admin getAllUsers: PERMISSION DENIED — the Admin SDK credential is missing or invalid. " +
          "Set FIREBASE_SERVICE_ACCOUNT_KEY (or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY)."
      );
    }
  }

  // Fallback to live cached users
  if (usersMap.size === 0) {
    Array.from(LIVE_USERS_CACHE.values()).forEach((u) => {
      usersMap.set(u.uid, u);
    });
  }

  const allNodes = await getAllFleetNodes();
  const allPayments = await getAllPayments();

  const result: AdminUserRecord[] = [];
  Array.from(usersMap.values()).forEach((u) => {
    const userNodes = allNodes.filter((n) => n.userId === u.uid || n.userId === u.id);
    const userPayments = allPayments.filter((p) => p.userId === u.uid || p.userId === u.id || (p.email && p.email.toLowerCase() === u.email.toLowerCase()));
    const totalSpend = userPayments.reduce((acc, p) => acc + (p.status === "paid" ? p.amountInr : 0), 0);

    result.push({
      ...u,
      assignedNodes: userNodes,
      transactionsCount: userPayments.length,
      totalSpendInr: totalSpend,
    });
  });

  return result.sort((a, b) => (b.email === "ssynthrun@gmail.com" ? 1 : -1));
}

/**
 * Get user by UID
 */
export async function getUserById(uid: string): Promise<AdminUserRecord | null> {
  const users = await getAllUsers();
  const found = users.find((u) => u.uid === uid || u.id === uid);
  if (found) return found;

  try {
    const db = getAdminDb();
    if (db) {
      const snap = await withTimeout(db.collection("users").doc(uid).get(), 3000);
      if (snap) {
        if (snap.exists) {
        const d = snap.data() as Record<string, unknown>;
        return {
          id: uid,
          uid,
          email: String(d.email || ""),
          firstName: String(d.firstName || ""),
          lastName: String(d.lastName || ""),
          photoURL: String(d.photoURL || ""),
          company: String(d.company || ""),
          phoneNumber: String(d.phoneNumber || ""),
          plan: (d.plan as AdminUserRecord["plan"]) || "free",
          status: (d.status as AdminUserRecord["status"]) || "active",
          nodes: Number(d.nodes ?? 1),
          expiresAt: parseTimestamp(d.expiresAt),
        };
        }
      }
    }
  } catch {}

  return null;
}

/**
 * Update real user document in Firestore `users/{uid}` and `subscriptions/{uid}`
 */
export async function updateUser(
  uid: string,
  updates: Partial<AdminUserRecord>
): Promise<AdminUserRecord> {
  const current = (await getUserById(uid)) || {
    id: uid,
    uid,
    email: updates.email || "unknown@user.com",
    plan: "free",
    status: "active",
    nodes: 1,
  };

  const updated: AdminUserRecord = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  LIVE_USERS_CACHE.set(uid, updated);

  try {
    const db = getAdminDb();
    if (db) {
      const cleanPayload: Record<string, unknown> = {
        ...updates,
        updatedAt: serverTimestamp(),
      };
      delete cleanPayload.assignedNodes;
      delete cleanPayload.id;

      await withTimeout(db.collection("users").doc(uid).set(cleanPayload, { merge: true }), 3000);

      if (
        updates.plan !== undefined ||
        updates.status !== undefined ||
        updates.nodes !== undefined ||
        updates.expiresAt !== undefined
      ) {
        await withTimeout(
          db.collection("subscriptions").doc(uid).set(
            {
              userId: uid,
              plan: updated.plan,
              status: updated.status,
              nodeCount: updated.nodes,
              expiresAt: updated.expiresAt,
              version: Math.floor(Date.now() / 1000),
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          ),
          3000
        );
      }
    }
  } catch (err) {
    console.error("Firestore user update error:", err);
  }

  return updated;
}

/**
 * Modify real plan duration (+days, -days, or custom date)
 */
export async function modifyUserPlanDuration(
  uid: string,
  daysDelta: number | null,
  customExpiryDate?: string
): Promise<AdminUserRecord> {
  const user = await getUserById(uid);
  if (!user) throw new Error("User not found");

  let newExpiry: Date;
  if (customExpiryDate) {
    newExpiry = new Date(customExpiryDate);
  } else if (typeof daysDelta === "number") {
    const base = user.expiresAt ? new Date(user.expiresAt) : new Date();
    const startingTime = daysDelta > 0 && base.getTime() < Date.now() ? Date.now() : base.getTime();
    newExpiry = new Date(startingTime + daysDelta * 864e5);
  } else {
    newExpiry = new Date(Date.now() + 30 * 864e5);
  }

  const status = newExpiry.getTime() > Date.now() ? "active" : "past_due";

  return await updateUser(uid, {
    expiresAt: newExpiry.toISOString(),
    status: user.status === "banned" ? "banned" : status,
  });
}

// ----------------------------------------------------------------------------
// Real Fleet Nodes Store
// ----------------------------------------------------------------------------
export async function getAllFleetNodes(): Promise<AdminFleetNode[]> {
  const list: AdminFleetNode[] = [];

  try {
    const db = getAdminDb();
    if (db) {
      const snap = await withTimeout(db.collection("cloud_fleet_nodes").get(), 3000);
      if (snap && snap.docs) {
        for (const d of snap.docs) {
          const data = d.data() as Partial<AdminFleetNode>;
          const id = d.id;
          const rec: AdminFleetNode = {
            id,
            nodeId: data.nodeId || id,
            userId: data.userId || "system",
            name: data.name || "Fleet Node",
            region: data.region || "us-east-1",
            host: data.host || "0.0.0.0",
            port: data.port || 8443,
            status: data.status || "online",
            version: data.version || "v2.4.0",
            latencyMs: data.latencyMs || 12,
            cpuUsage: data.cpuUsage || 15,
            memoryUsage: data.memoryUsage || 25,
            token: data.token || `cf_tok_${id.slice(0, 8)}`,
            policyMode: data.policyMode || "strict",
            createdAt: parseTimestamp(data.createdAt) || new Date().toISOString(),
          };
          list.push(rec);
          LIVE_NODES_CACHE.set(id, rec);
        }
      }
    }
  } catch {}

  if (list.length === 0) {
    Array.from(LIVE_NODES_CACHE.values()).forEach((n) => list.push(n));
  }

  return list;
}

export async function createFleetNode(node: Omit<AdminFleetNode, "id">): Promise<AdminFleetNode> {
  const id = `node_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const fullNode: AdminFleetNode = {
    id,
    ...node,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  LIVE_NODES_CACHE.set(id, fullNode);

  try {
    const db = getAdminDb();
    if (db) {
      await withTimeout(
        db.collection("cloud_fleet_nodes").doc(id).set({
          ...fullNode,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }),
        3000
      );
    }
  } catch {}

  return fullNode;
}

export async function updateFleetNode(
  id: string,
  updates: Partial<AdminFleetNode>
): Promise<AdminFleetNode> {
  const current = LIVE_NODES_CACHE.get(id) || {
    id,
    nodeId: id,
    userId: "system",
    name: "Node",
    region: "us-east-1",
    host: "0.0.0.0",
    port: 8443,
    status: "online",
    version: "v2.4.0",
    latencyMs: 15,
    cpuUsage: 20,
    memoryUsage: 35,
    token: "tok_default",
    policyMode: "strict",
  };

  const updated: AdminFleetNode = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  LIVE_NODES_CACHE.set(id, updated);

  try {
    const db = getAdminDb();
    if (db) {
      await withTimeout(
        db.collection("cloud_fleet_nodes").doc(id).set(
          {
            ...updates,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        ),
        3000
      );
    }
  } catch {}

  return updated;
}

export async function deleteFleetNode(id: string): Promise<boolean> {
  LIVE_NODES_CACHE.delete(id);
  try {
    const db = getAdminDb();
    if (db) {
      await withTimeout(db.collection("cloud_fleet_nodes").doc(id).delete(), 3000);
    }
  } catch {}
  return true;
}

// ----------------------------------------------------------------------------
// Real Payments Store
// ----------------------------------------------------------------------------
export async function getAllPayments(): Promise<AdminPaymentRecord[]> {
  const list: AdminPaymentRecord[] = [];

  try {
    const db = getAdminDb();
    if (db) {
      const snap = await withTimeout(db.collection("payments").get(), 3000);
      if (snap && snap.docs) {
        for (const d of snap.docs) {
          const data = d.data() as Record<string, unknown>;
          const id = d.id;
          const rec: AdminPaymentRecord = {
            id,
            userId: String(data.userId || ""),
            email: String(data.email || ""),
            plan: String(data.plan || "starter"),
            nodes: Number(data.nodes || 1),
            amountInr: Number(data.amountInr || data.amount || 0),
            status: (data.status as AdminPaymentRecord["status"]) || "paid",
            razorpayOrderId: String(data.razorpayOrderId || ""),
            razorpayPaymentId: String(data.razorpayPaymentId || ""),
            createdAt: parseTimestamp(data.createdAt) || new Date().toISOString(),
          };
          list.push(rec);
          LIVE_PAYMENTS_CACHE.set(id, rec);
        }
      }
    }
  } catch {}

  if (list.length === 0) {
    Array.from(LIVE_PAYMENTS_CACHE.values()).forEach((p) => list.push(p));
  }

  return list.sort((a, b) => (new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
}

export async function createManualPayment(
  payment: Omit<AdminPaymentRecord, "id">
): Promise<AdminPaymentRecord> {
  const id = `pay_${Date.now()}`;
  const rec: AdminPaymentRecord = {
    id,
    ...payment,
    createdAt: new Date().toISOString(),
  };

  LIVE_PAYMENTS_CACHE.set(id, rec);

  try {
    const db = getAdminDb();
    if (db) {
      await withTimeout(
        db.collection("payments").doc(id).set({
          ...rec,
          createdAt: serverTimestamp(),
        }),
        3000
      );
    }
  } catch {}

  return rec;
}
