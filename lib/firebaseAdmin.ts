// firebaseAdmin — SERVER-ONLY Firebase Admin SDK bootstrap.
//
// The client Firebase SDK (lib/firebase.ts) talks to Firestore as an
// unauthenticated party when used inside API routes, so security rules
// (firestore.rules) correctly deny reads of /users, /payments, etc.
// Admin API routes must therefore use the Admin SDK, which runs with
// elevated privileges and bypasses security rules.
//
// Credentials (pick one, checked in this order):
//   1. FIREBASE_SERVICE_ACCOUNT_KEY      — full service-account JSON
//      (raw JSON or base64-encoded, as set in Vercel env vars)
//   2. FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
//      — individual fields (private key with \n escapes is accepted)
//   3. GOOGLE_APPLICATION_CREDENTIALS / ADC — when running on infra
//      with Application Default Credentials attached.
import { initializeApp, getApps, getApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

interface ServiceAccountLike {
  projectId?: string;
  clientEmail?: string;
  privateKey?: string;
}

function parseServiceAccount(): ServiceAccountLike | null {
  const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (rawKey && rawKey.trim()) {
    try {
      const decoded = rawKey.trim().startsWith("{")
        ? rawKey
        : Buffer.from(rawKey, "base64").toString("utf8");
      const parsed = JSON.parse(decoded) as Record<string, string>;
      // Service account JSON files store the key with literal \n escapes
      const privateKey = (parsed.private_key || "").replace(/\\n/g, "\n");
      return {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey,
      };
    } catch (err) {
      console.error("Invalid FIREBASE_SERVICE_ACCOUNT_KEY (not JSON/base64):", err);
      return null;
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey };
  }

  return null;
}

let adminApp: App | null = null;

export function getAdminApp(): App | null {
  if (adminApp) return adminApp;
  const sa = parseServiceAccount();

  try {
    if (sa && sa.projectId && sa.clientEmail && sa.privateKey) {
      adminApp = getApps().length
        ? getApp()
        : initializeApp({
            credential: getCert(sa),
            projectId: sa.projectId,
          });
    } else {
      // Fall back to Application Default Credentials (no explicit key env vars)
      adminApp = getApps().length ? getApp() : initializeApp();
    }
    return adminApp;
  } catch (err) {
    console.error("Firebase Admin SDK initialization failed:", err);
    return null;
  }
}

// Imported lazily-ish: kept at module scope but only instantiated inside getAdminApp
function getCert(sa: ServiceAccountLike) {
  return cert({
    projectId: sa.projectId,
    clientEmail: sa.clientEmail,
    privateKey: sa.privateKey,
  });
}

export function getAdminDb(): Firestore | null {
  const a = getAdminApp();
  if (!a) return null;
  try {
    return getFirestore(a);
  } catch (err) {
    console.error("Failed to obtain Admin Firestore instance:", err);
    return null;
  }
}
