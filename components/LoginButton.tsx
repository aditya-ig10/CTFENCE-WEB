"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  type User,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { firebaseEnabled, getFirebaseAuth, getFirebaseDb, initFirebaseAnalytics } from "@/lib/firebase";

// navbar login: google sign-in through firebase auth. on first login a
// users/{uid} doc is seeded in firestore (rules: owner read/write only).
// once signed in the pill becomes a profile link — avatar + name — and the
// sign-out action lives on the profile page. hides itself entirely when the
// firebase env vars are absent.
export default function LoginButton() {
  const [user, setUser] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  // subscribe on every effect run (cleanup unsubs) — a one-shot guard here
  // breaks under react strict mode's double mount: the listener gets torn
  // down on the first unmount and never re-attached, so the button never
  // sees the signed-in user.
  useEffect(() => {
    if (!firebaseEnabled) return;
    initFirebaseAnalytics();
    const auth = getFirebaseAuth();
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) void ensureUserDoc(u);
    });
    return () => unsub();
  }, []);

  if (!firebaseEnabled) return null;

  // seed users/{uid} on first login — matches the firestore rules
  // (create allowed only for the owner) and the field shape used on
  // the profile page.
  async function ensureUserDoc(u: User) {
    const db = getFirebaseDb();
    if (!db) return;
    try {
      const ref = doc(db, "users", u.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) return;
      const name = u.displayName ?? "";
      const [firstName = "", ...rest] = name.split(" ");
      await setDoc(ref, {
        firstName,
        lastName: rest.join(" "),
        email: u.email ?? "",
        photoURL: u.photoURL ?? "",
        company: "",
        fieldOfWork: "",
        hearAbout: "",
        phoneDial: "",
        phoneNumber: "",
        plan: "free",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch {
      // doc seeding is best-effort; the profile page can create it on save
    }
  }

  async function login() {
    const auth = getFirebaseAuth();
    if (!auth) return;
    setBusy(true);
    setError(false);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch {
      // popup closed or blocked — surface a quiet failure state
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  if (user) {
    const name =
      user.displayName?.split(" ")[0] ?? user.email?.split("@")[0] ?? "Account";
    return (
      <Link href="/profile" className="topbar-cta login-btn" title="Open your profile">
        {user.photoURL ? (
          <img className="login-avatar" src={user.photoURL} alt="" referrerPolicy="no-referrer" />
        ) : (
          <span className="login-avatar login-avatar--initial" aria-hidden="true">
            {name.charAt(0).toUpperCase()}
          </span>
        )}
        <span>{name}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true" className="login-out-icon">
          <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="topbar-cta login-btn"
      onClick={login}
      disabled={busy}
      title="Sign in with Google"
    >
      <span>{error ? "Retry" : busy ? "Signing in…" : "Login"}</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}