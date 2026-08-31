// firebase — website login. config comes from NEXT_PUBLIC_FIREBASE_* env
// vars (public client-side values, safe to expose; auth rules live in the
// firebase console). initializes app + analytics (browser only) and exports
// the auth instance for the login button.
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? "",
};

// true when the env vars are present — the login button hides itself otherwise
export const firebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: FirebaseApp | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (!firebaseEnabled || typeof window === "undefined") return null;
  if (!app) app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return app;
}

export function getFirebaseAuth(): Auth | null {
  const a = getFirebaseApp();
  return a ? getAuth(a) : null;
}

export function getFirebaseDb(): Firestore | null {
  const a = getFirebaseApp();
  return a ? getFirestore(a) : null;
}

// analytics is browser-only and unsupported in some environments (SSR,
// extensions) — attach it silently when possible.
export function initFirebaseAnalytics(): Analytics | null {
  const a = getFirebaseApp();
  if (!a) return null;
  isSupported()
    .then((yes) => {
      if (yes) getAnalytics(a);
    })
    .catch(() => {
      // no analytics in this environment — not a problem
    });
  return null;
}