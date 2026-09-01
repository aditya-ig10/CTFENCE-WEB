"use client";

import { useEffect, useMemo, useState } from "react";
import {
  EMPTY_BILLING,
  REFERRAL_CODES,
  PLAN_PRICING,
  quoteCheckout,
  referralDiscount,
  taxRateForCountry,
  getExpiryDate,
  type BillingAddress,
  type PlanId,
  type BillingCycle,
} from "@/lib/checkout";
import {
  fetchStates,
  verifyIndiaPin,
  validatePostal,
  defaultPhoneCodeForCountry,
} from "@/lib/geo";
import { apiRequest } from "@/lib/apiClient";
import { firebaseEnabled, getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { addDoc, collection, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, Timestamp, where } from "firebase/firestore";
import gsap from "gsap";
import { motionAllowed } from "@/lib/anim";

// step one of checkout: billing details + order summary. no currency selector
// — the site prices in INR and the amount is fixed server-side. the visitor
// picks their node count, enters an optional referral, fills billing, and
// presses "send payment link". the page mints a one-time magic link (token)
// carrying the tax-inclusive total for the chosen nodes — the amount the
// payment step can never change.

const PLAN_NAMES: Record<PlanId, string> = {
  starter: "Starter",
  teams: "Teams",
};
const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

const CITY_PLACEHOLDER: Record<string, string> = {
  India: "Bengaluru",
  "United States": "New York",
  "United Kingdom": "London",
  Australia: "Sydney",
  "United Arab Emirates": "Dubai",
  Singapore: "Singapore",
  Canada: "Toronto",
  Germany: "Berlin",
  France: "Paris",
  Japan: "Tokyo",
  Brazil: "São Paulo",
};

const STATE_LABELS: Record<string, string> = {
  "United States": "State",
  "United Kingdom": "County / Region",
  Australia: "State / Territory",
  Canada: "Province / Territory",
};
const IN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh",
  "Chhattisgarh", "Dadra and Nagar Haryana", "Ladakh", "Lakshadweep",
  "Madhya Pradesh", "Maharashtra", "Goa", "Gujarat", "Haryana",
  "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka", "Kerala",
  "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

const POSTAL_PLACEHOLDER: Record<string, string> = {
  India: "560001",
  "United States": "10001",
  "United Kingdom": "SW1A 1AA",
  Germany: "10115",
  France: "75001",
  Canada: "M5V 3L9",
  Australia: "2000",
  Brazil: "01310-100",
  Japan: "100-0001",
};

const COUNTRY_FLAGS: Record<string, string> = {
  India: "🇮🇳",
  "United States": "🇺🇸",
  "United Kingdom": "🇬🇧",
  Australia: "🇦🇺",
  "United Arab Emirates": "🇦🇪",
  Singapore: "🇸🇬",
  Canada: "🇨🇦",
  Germany: "🇩🇪",
  France: "🇫🇷",
  Japan: "🇯🇵",
  Brazil: "🇧🇷",
};

export default function CheckoutClient({
  planId,
  geoCountry,
  initialNodes,
  initialAddNodes,
}: {
  planId: PlanId;
  geoCountry: string | null;
  initialNodes?: number;
  initialAddNodes?: number;
}) {
  const pricing = PLAN_PRICING[planId];
  const isAddOn = typeof initialAddNodes === "number" && Number.isFinite(initialAddNodes) && initialAddNodes > 0;
  const [nodes, setNodes] = useState(() => {
    if (isAddOn) {
      const maxAdd = Math.max(pricing.maxNodes - pricing.minNodes, 1);
      return Math.min(Math.max(Math.round(initialAddNodes!), 1), maxAdd);
    }
    if (typeof initialNodes === "number" && Number.isFinite(initialNodes)) {
      return Math.min(Math.max(Math.round(initialNodes), pricing.minNodes), pricing.maxNodes);
    }
    return pricing.minNodes;
  });
  const [billingCycle] = useState<BillingCycle>("monthly");
  const [referral, setReferral] = useState("");
  const [applied, setApplied] = useState<string | null>(null);
  // country is locked to the visitor's IP — no selector. geoCountry (from
  // x-vercel-ip-country-name) is authoritative on Vercel; on localhost we
  // fall back to geojs. until resolved we show a placeholder and keep the
  // form disabled for the country-dependent fields.
  const [fixedCountry, setFixedCountry] = useState<string | null>(geoCountry);
  const [geoResolved, setGeoResolved] = useState(!!geoCountry);
  const [billing, setBilling] = useState<BillingAddress>({
    ...EMPTY_BILLING,
    country: geoCountry ?? "",
    phoneCode: geoCountry ? defaultPhoneCodeForCountry(geoCountry) : "+91",
  });
  const [states, setStates] = useState<string[] | null>(null);
  const [statesLoading, setStatesLoading] = useState(false);
  const [pinOk, setPinOk] = useState<null | boolean>(null);
  const [pinBusy, setPinBusy] = useState(false);
  const [pinTouched, setPinTouched] = useState(false);
  const [phase, setPhase] = useState<"idle" | "creating" | "review" | "ordering" | "verifying" | "done" | "error">("idle");
  const [token, setToken] = useState<string | null>(null);
  const [rzpReady, setRzpReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const router = useRouter();

  const { min, max } = isAddOn
    ? { min: 1, max: Math.max(pricing.maxNodes - pricing.minNodes, 1) }
    : { min: pricing.minNodes, max: pricing.maxNodes };

  function setField(k: keyof BillingAddress, v: string) {
    // country / phoneCode / email (when logged in) are fixed
    if (k === "country" || k === "phoneCode") return;
    if (k === "email" && authUser?.email) return;
    setBilling((p) => ({ ...p, [k]: v }));
  }

  const effectiveCountry = fixedCountry ?? billing.country;

  const quote = useMemo(() => {
    if (isAddOn) {
      const perNodeInr = pricing.perNodeInr;
      const cycleMul = billingCycle === "yearly" ? 12 : 1;
      const cycleDisc = billingCycle === "yearly" ? 0.08 : 0;
      let baseInr = perNodeInr * nodes * cycleMul;
      if (cycleDisc > 0) baseInr = Math.round(baseInr * (1 - cycleDisc));
      const off = referralDiscount(applied);
      const code = off > 0 ? (applied as string) : null;
      const discount = off > 0 ? Math.round(baseInr * off) : 0;
      const taxable = Math.max(baseInr - discount, 0);
      const taxRate = taxRateForCountry(effectiveCountry);
      const taxInr = Math.round(taxable * taxRate);
      const totalInr = taxable + taxInr;
      return {
        planId,
        currency: "INR" as const,
        baseInr,
        base: baseInr,
        discount,
        amount: totalInr,
        amountPaise: totalInr * 100,
        referralCode: code,
        nodes,
        perNodeInr,
        subtotalInr: baseInr,
        taxInr,
        taxRate,
        totalInr,
        billingCycle,
      };
    }
    return quoteCheckout(planId, "INR", applied, { nodes, country: effectiveCountry, billingCycle });
  }, [planId, applied, nodes, effectiveCountry, pricing, isAddOn, billingCycle]);

  // resolve country from IP when the server didn't supply one (localhost / dev)
  useEffect(() => {
    if (geoResolved) return;
    setGeoResolved(true);
    void fetch("https://get.geojs.io/v1/ip/country_name.json")
      .then((r) => (r.ok ? r.text() : ""))
      .catch(() => "")
      .then((raw) => {
        let country = raw ? raw.replace(/^"+|"+$/g, "").trim() : "";
        if (country.length === 2) {
          const isoMap: Record<string, string> = {
            IN: "India",
            US: "United States",
            GB: "United Kingdom",
            UK: "United Kingdom",
            AU: "Australia",
            AE: "United Arab Emirates",
            SG: "Singapore",
            CA: "Canada",
            DE: "Germany",
            FR: "France",
            JP: "Japan",
            BR: "Brazil",
          };
          country = isoMap[country.toUpperCase()] ?? country;
        }
        if (country && country.length > 1) setFixedCountry(country);
        else setFixedCountry("India");
      });
  }, [geoResolved]);

  // keep billing.country + phoneCode in lockstep with IP, but don't clobber an already auto-filled past billing
  useEffect(() => {
    if (!fixedCountry) return;
    setBilling((b) => {
      // if we already have a non-empty country from past billing auto-fill, keep it (user can still edit other fields)
      // only auto-set when empty or still the placeholder
      if (b.country && b.country.trim() !== "" && b.country !== fixedCountry) {
        return b;
      }
      return {
        ...b,
        country: fixedCountry,
        phoneCode: defaultPhoneCodeForCountry(fixedCountry),
      };
    });
    setPinOk(null);
    setPinTouched(false);
  }, [fixedCountry]);

  // lock email to the logged-in Firebase user — not editable
  useEffect(() => {
    if (!firebaseEnabled) return;
    const auth = getFirebaseAuth();
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (u) => {
      setAuthUser(u);
      if (u?.email) {
        setBilling((b) => ({ ...b, email: u.email ?? "" }));
        if (u.displayName) {
          const [first = "", ...rest] = (u.displayName ?? "").split(" ");
          setBilling((b) => ({
            ...b,
            firstName: b.firstName || first,
            lastName: b.lastName || rest.join(" "),
          }));
        }
      }
    });
    return () => unsub();
  }, []);

  // preload Razorpay early so it's ready by review
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as { Razorpay?: unknown };
    if (w.Razorpay) {
      setRzpReady(true);
      return;
    }
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]') as HTMLScriptElement | null;
    if (existing) {
      if ((w as unknown as { Razorpay?: unknown }).Razorpay) setRzpReady(true);
      else {
        existing.addEventListener("load", () => setRzpReady(true));
        existing.addEventListener("error", () => setRzpReady(false));
      }
      return;
    }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => setRzpReady(true);
    s.onerror = () => setRzpReady(false);
    document.head.appendChild(s);
  }, []);

function cleanPlaintext(val: unknown): string {
  if (typeof val !== "string" || !val) return "";
  if (/^v\d+:[0-9a-fA-F]+:[0-9a-fA-F]+/.test(val)) return "";
  return val;
}

  // auto-fill past billing details from Firebase for next purchase (lastBilling or most recent payment)
  useEffect(() => {
    if (!authUser) return;
    const db = getFirebaseDb();
    if (!db) return;
    let cancelled = false;
    (async () => {
      try {
        const userSnap = await getDoc(doc(db, "users", authUser.uid));
        if (cancelled) return;
        const data = userSnap.data() as Record<string, unknown> | undefined;
        const saved = (data?.lastBilling ?? data?.billing) as Partial<BillingAddress> | undefined;
        if (saved && typeof saved === "object" && Object.keys(saved).length > 2) {
          const sFirst = cleanPlaintext(saved.firstName);
          const sLast = cleanPlaintext(saved.lastName);
          const sPhone = cleanPlaintext(saved.phone);
          const sAddr1 = cleanPlaintext(saved.address1);
          const sAddr2 = cleanPlaintext(saved.address2);
          const sCity = cleanPlaintext(saved.city);
          const sState = cleanPlaintext(saved.state);
          const sPostal = cleanPlaintext(saved.postal);
          const sComp = cleanPlaintext(saved.company);
          setBilling((b) => ({
            ...b,
            firstName: b.firstName || sFirst,
            lastName: b.lastName || sLast,
            phone: b.phone || sPhone,
            address1: b.address1 || sAddr1,
            address2: b.address2 || sAddr2,
            city: b.city || sCity,
            state: b.state || sState,
            postal: b.postal || sPostal,
            company: b.company || sComp,
          }));
          if (sPostal) {
            setPinTouched(true);
            setPinOk(validatePostal(String(saved.country ?? effectiveCountry ?? ""), sPostal));
          }
          return;
        }
        const q = query(collection(db, "payments"), where("userId", "==", authUser.uid), limit(5));
        const snap = await getDocs(q);
        if (cancelled || snap.empty) return;
        const sorted = snap.docs
          .map((d) => ({ data: d.data() as Record<string, unknown>, dt: (d.data() as unknown as { createdAt?: { toDate?: () => Date } })?.createdAt?.toDate?.() ?? new Date(0) }))
          .sort((a, b) => b.dt.getTime() - a.dt.getTime());
        const recent = sorted[0]?.data?.billing as Partial<BillingAddress> | undefined;
        if (recent && typeof recent === "object") {
          setBilling((b) => ({
            ...b,
            firstName: b.firstName || cleanPlaintext(recent.firstName),
            lastName: b.lastName || cleanPlaintext(recent.lastName),
            phone: b.phone || cleanPlaintext(recent.phone),
            address1: b.address1 || cleanPlaintext(recent.address1),
            address2: b.address2 || cleanPlaintext(recent.address2),
            city: b.city || cleanPlaintext(recent.city),
            state: b.state || cleanPlaintext(recent.state),
            postal: b.postal || cleanPlaintext(recent.postal),
            company: b.company || cleanPlaintext(recent.company),
          }));
          if (recent.postal) {
            setPinTouched(true);
            setPinOk(validatePostal(String(recent.country ?? effectiveCountry ?? ""), String(recent.postal)));
          }
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [authUser, effectiveCountry]);

  // auto-fetch state from pincode (India: 6-digit) — fills state without user picking
  useEffect(() => {
    if (effectiveCountry !== "India") return;
    const pin = billing.postal.trim();
    if (!/^\d{6}$/.test(pin)) return;
    // don't refetch if state already matches the pin's state (avoid loop)
    let cancelled = false;
    setPinBusy(true);
    verifyIndiaPin(pin)
      .then((found) => {
        if (cancelled || !found) return;
        setBilling((b) => (b.state ? b : { ...b, state: found.state }));
        setPinOk(true);
        setPinTouched(true);
      })
      .catch(() => {
        // format-valid pin — keep as valid even if API fails
        if (!cancelled) setPinOk(true);
      })
      .finally(() => {
        if (!cancelled) setPinBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [billing.postal, effectiveCountry]);

  // load states for the locked country (India uses the curated list)
  useEffect(() => {
    const c = fixedCountry ?? billing.country;
    if (!c) return;
    setStates(null);
    if (c === "India") return setStates(IN_STATES);
    setStatesLoading(true);
    void fetchStates(c).then((s) => {
      setStates(s);
      setStatesLoading(false);
    });
  }, [fixedCountry, billing.country]);

  function applyReferral() {
    const code = referral.trim().toUpperCase();
    if (!code) return setApplied(null);
    if (REFERRAL_CODES[code]) {
      setApplied(code);
      if (error) setError(null);
    } else {
      setApplied(null);
      setError(`code "${code}" is not recognised`);
    }
  }

  function step(d: number) {
    setNodes((n) => Math.min(Math.max(n + d, min), max));
  }

  // format check — only after the field has been touched (blur or submit)
  // so we don't flash "invalid" while the user is still typing a partial code.
  const postalFormatInvalid =
    pinTouched && billing.postal.trim().length > 0 && !validatePostal(effectiveCountry, billing.postal);
  const postalInvalid = postalFormatInvalid || pinOk === false;

  async function verifyPin() {
    if (!billing.postal.trim()) return setPinOk(null);
    setPinBusy(true);
    setPinOk(null);
    setPinTouched(true);
    if (effectiveCountry === "India") {
      const formatOk = /^\d{6}$/.test(billing.postal.trim());
      if (!formatOk) {
        setPinOk(false);
        setPinBusy(false);
        return;
      }
      // format is valid — try to autofill state, but don't fail validation on API miss
      try {
        const found = await verifyIndiaPin(billing.postal);
        if (found) {
          setPinOk(true);
          setBilling((b) => ({
            ...b,
            state: b.state ? b.state : found.state,
          }));
        } else {
          // valid 6-digit format — treat as valid even if API didn't return (network or unknown pin)
          setPinOk(true);
        }
      } catch {
        setPinOk(true);
      }
    } else {
      setPinOk(validatePostal(effectiveCountry, billing.postal));
    }
    setPinBusy(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPinTouched(true);
    // email is locked to the Firebase account — use that as source of truth to avoid race where billing.email is still "" on first click
    const effectiveEmail = (authUser?.email ?? billing.email).trim().toLowerCase();
    const effectiveFirst = billing.firstName.trim() || (authUser?.displayName?.split(" ")[0] ?? "");
    const effectiveLast = billing.lastName.trim() || (authUser?.displayName?.split(" ").slice(1).join(" ") ?? "");
    const effectiveBilling: typeof billing = {
      ...billing,
      email: effectiveEmail,
      firstName: effectiveFirst,
      lastName: effectiveLast,
      country: effectiveCountry || billing.country,
    };
    if (firebaseEnabled && !authUser) {
      setError("Please log in with Google to continue — your email is tied to your account.");
      return;
    }
    if (!effectiveEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(effectiveEmail)) {
      setError("Please log in — we need a valid email from your account.");
      return;
    }
    if (!effectiveFirst || !effectiveLast || !billing.address1 || !billing.city) {
      setError("Please fill the required billing fields.");
      return;
    }
    if (!effectiveCountry) {
      setError("Detecting your country — please wait a moment and try again.");
      return;
    }
    if (!validatePostal(effectiveCountry, effectiveBilling.postal)) {
      setError(`Please enter a valid postal code for ${effectiveCountry}.`);
      setPinOk(false);
      return;
    }
    setPhase("creating");
    // save past billing for next purchase auto-fill (best-effort, no await)
    if (authUser) {
      const db = getFirebaseDb();
      if (db) {
        void setDoc(doc(db, "users", authUser.uid), { lastBilling: effectiveBilling, updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});
      }
    }
    try {
      const result = await apiRequest<{ ok: boolean; token: string }>("/api/checkout-link", {
        method: "POST",
        body: JSON.stringify({
          plan: planId,
          ...(isAddOn ? { addNodes: nodes } : { nodes }),
          billingCycle,
          referralCode: applied,
          billing: effectiveBilling,
        }),
      });
      if (!result.ok) {
        setError(result.error || "could not create the checkout link");
        setPhase("error");
        return;
      }
      setToken(result.data.token);
      setPhase("review");
    } catch {
      setError("network error — try again");
      setPhase("error");
    }
  }

  // same-checkout final review + payment — no separate magic-link page
  async function payNow() {
    if (!token) {
      setError("missing checkout token — please go back and try again");
      return;
    }
    // ensure Razorpay is loaded — retry with dynamic injection if needed
    const ensureRazorpay = async (): Promise<boolean> => {
      const w = window as unknown as { Razorpay?: unknown };
      if (w.Razorpay) return true;
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 200));
        if ((window as unknown as { Razorpay?: unknown }).Razorpay) return true;
      }
      if (!document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
        const s = document.createElement("script");
        s.src = "https://checkout.razorpay.com/v1/checkout.js";
        s.async = true;
        document.head.appendChild(s);
      }
      for (let i = 0; i < 15; i++) {
        await new Promise((r) => setTimeout(r, 200));
        if ((window as unknown as { Razorpay?: unknown }).Razorpay) {
          setRzpReady(true);
          return true;
        }
      }
      return !!(window as unknown as { Razorpay?: unknown }).Razorpay;
    };
    const ready = await ensureRazorpay();
    if (!ready) {
      setError("payment gateway failed to load — please refresh, disable ad blocker, and try again");
      setPhase("review");
      return;
    }
    setError(null);
    setPhase("ordering");
    try {
      const orderResult = await apiRequest<{
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
        planId: string;
        email: string;
        nodes: number;
      }>("/api/create-order", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      if (!orderResult.ok) {
        setError(orderResult.error || "could not start order");
        setPhase("review");
        return;
      }
      const data = orderResult.data;
      const win = window as unknown as {
        Razorpay?: new (opts: Record<string, unknown>) => { open: () => void; on: (e: string, cb: (r: unknown) => void) => void };
      };
      if (!win.Razorpay) {
        setError("Razorpay did not load — refresh and try again");
        setPhase("review");
        return;
      }
      setPhase("verifying");
      const rzp = new win.Razorpay({
        key: data.keyId,
        order_id: data.orderId,
        amount: data.amount,
        currency: data.currency,
        name: "Context Fence",
        description: `${PLAN_NAMES[planId]} · ${data.nodes} enforcement nodes`,
        theme: { color: "#ff3144" },
        handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          void (async () => {
            try {
              const vResult = await apiRequest<{
                orderId: string;
                paymentId: string;
                keyVersion: string;
                e1: string;
                e2Hash: string;
                iv: string;
                encryptedBilling?: Record<string, unknown>;
              }>("/api/verify-payment", {
                method: "POST",
                body: JSON.stringify({
                  ...response,
                  billing: effectiveBilling,
                }),
              });
              if (!vResult.ok) {
                setError(vResult.error || "verification failed — contact us before retrying");
                setPhase("review");
                return;
              }
              const vdata = vResult.data;
              // sync encrypted payment record to Firebase
              try {
                const auth = getFirebaseAuth();
                const db = getFirebaseDb();
                if (auth?.currentUser && db) {
                  let expiresAt = Timestamp.fromDate(getExpiryDate(billingCycle));
                  let newTotal = nodes;
                  let existingPlanPurchasedAt: unknown = null;
                  if (isAddOn) {
                    try {
                      const snap = await getDoc(doc(db, "users", auth.currentUser.uid));
                      const data = (snap.data() as Record<string, unknown>) || {};
                      const cur = data.nodes as number | undefined;
                      const curNodes = typeof cur === "number" ? cur : pricing.minNodes;
                      newTotal = Math.min(curNodes + nodes, pricing.maxNodes);
                      // Preserve existing static plan expiration and purchase date
                      if (data.expiresAt) {
                        expiresAt = data.expiresAt as Timestamp;
                      }
                      existingPlanPurchasedAt = data.planPurchasedAt || data.planCreatedAt || data.createdAt || null;
                    } catch {
                      newTotal = Math.min(pricing.minNodes + nodes, pricing.maxNodes);
                    }
                  }
                  const userUpdatePayload: Record<string, unknown> = {
                    plan: planId,
                    nodes: newTotal,
                    expiresAt,
                    lastBilling: effectiveBilling,
                    updatedAt: serverTimestamp(),
                    lastPaymentId: response.razorpay_payment_id,
                    lastPaymentKeyVersion: vdata.keyVersion,
                  };
                  if (!isAddOn) {
                    userUpdatePayload.planPurchasedAt = serverTimestamp();
                    userUpdatePayload.planCreatedAt = serverTimestamp();
                  } else if (existingPlanPurchasedAt) {
                    userUpdatePayload.planPurchasedAt = existingPlanPurchasedAt;
                  }
                  await setDoc(
                    doc(db, "users", auth.currentUser.uid),
                    userUpdatePayload,
                    { merge: true }
                  );
                  await addDoc(collection(db, "payments"), {
                    userId: auth.currentUser.uid,
                    email: effectiveBilling.email,
                    plan: planId,
                    nodes: nodes,
                    amountInr: quote.totalInr,
                    subtotalInr: quote.subtotalInr,
                    discountInr: quote.discount,
                    taxInr: quote.taxInr,
                    taxRate: quote.taxRate,
                    billing: effectiveBilling,
                    e2Hash: vdata.e2Hash,
                    keyVersion: vdata.keyVersion,
                    iv: vdata.iv,
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    status: "paid",
                    createdAt: serverTimestamp(),
                    expiresAt,
                    expiresAtTime: expiresAt.toDate().toISOString(),
                    isAddOn: isAddOn,
                  });
                }
              } catch {
                // non-fatal
              }
              setPhase("done");
              router.push("/profile");
            } catch {
              setError("verification request failed — try again");
              setPhase("review");
            }
          })();
        },
        modal: {
          ondismiss: () => {
            setPhase("review");
            setError("checkout closed before payment — no charge was made");
          },
        },
      });
      rzp.on("payment.failed", () => {
        setPhase("review");
        setError("the payment failed at the bank — try another method");
      });
      rzp.open();
    } catch {
      setError("could not reach the checkout service");
      setPhase("review");
    }
  }

  // gsap — same system as hero/profile, runs on every phase change
  useEffect(() => {
    if (!motionAllowed()) return;
    const ctx = gsap.context(() => {
      gsap.from(".chk-card", { y: 18, opacity: 0, duration: 0.6, ease: "power3.out", stagger: 0.08, clearProps: "all" });
      gsap.from(".chk-title, .chk-eyebrow", { y: 12, opacity: 0, duration: 0.5, ease: "power3.out", stagger: 0.06, clearProps: "all" });
      gsap.from(".chk-bill-row, .chk-order-row", { x: -8, opacity: 0, duration: 0.4, ease: "power3.out", stagger: 0.04, clearProps: "all" });
    });
    return () => ctx.revert();
  }, [phase]);

  // keep effectiveBilling stable for review/pay
  const effectiveBilling: BillingAddress = {
    ...billing,
    email: (authUser?.email ?? billing.email).trim().toLowerCase(),
    firstName: billing.firstName.trim() || (authUser?.displayName?.split(" ")[0] ?? ""),
    lastName: billing.lastName.trim() || (authUser?.displayName?.split(" ").slice(1).join(" ") ?? ""),
    country: effectiveCountry || billing.country,
  } as BillingAddress;

  if (phase === "review" || phase === "ordering" || phase === "verifying" || phase === "done") {
    return (
      <div className="chk-page">
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" onLoad={() => setRzpReady(true)} />
        <div className="chk-eyebrow">{"// review & pay"}</div>
        <h1 className="chk-title">Review your order</h1>
        <p className="chk-sub">
          Locked for <strong>{inr(quote.totalInr)}</strong> · paying as <strong>{effectiveBilling.email}</strong> · {effectiveBilling.country}
          {applied ? ` · referral ${applied}` : ""}
        </p>

        {(phase === "ordering" || phase === "verifying") && (
          <div className="loading-overlay" aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 500 }}>
            <div className="loader">
              <span>
                <span />
                <span />
                <span />
                <span />
              </span>
              <div className="base">
                <span />
                <div className="face" />
              </div>
            </div>
            <div className="longfazers">
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
        )}

        <div className="chk-grid">
          <div className="chk-card">
            <h2 className="chk-card-title">Billing details</h2>
            <dl className="chk-bill chk-bill--canela">
              <div className="chk-bill-row">
                <dt>Name</dt>
                <dd>{[effectiveBilling.firstName, effectiveBilling.lastName].filter(Boolean).join(" ") || "—"}</dd>
              </div>
              <div className="chk-bill-row">
                <dt>Email</dt>
                <dd>{effectiveBilling.email}</dd>
              </div>
              <div className="chk-bill-row">
                <dt>Phone</dt>
                <dd>{[effectiveBilling.phoneCode, effectiveBilling.phone].filter(Boolean).join(" ") || "—"}</dd>
              </div>
              <div className="chk-bill-row">
                <dt>Address</dt>
                <dd>{[effectiveBilling.address1, effectiveBilling.address2, effectiveBilling.city, effectiveBilling.state, effectiveBilling.postal, effectiveBilling.country].filter(Boolean).join(", ") || "—"}</dd>
              </div>
              <div className="chk-bill-row">
                <dt>Nodes</dt>
                <dd>
                  {nodes} × {inr(quote.perNodeInr)} {nodes !== 1 ? "nodes" : "node"}
                </dd>
              </div>
            </dl>
            <button type="button" className="chk-apply" onClick={() => setPhase("idle")} style={{ marginTop: 14 }}>
              ← Edit details
            </button>
          </div>

          <aside className="chk-card chk-aside">
            <h2 className="chk-card-title">Amount due</h2>
            <div className="chk-bill chk-bill--canela">
              <div className="chk-bill-row">
                <dt>{isAddOn ? `Add ${nodes} node${nodes > 1 ? "s" : ""} to ${PLAN_NAMES[planId]}` : `${PLAN_NAMES[planId]} · ${nodes} nodes`}</dt>
                <dd>{inr(quote.subtotalInr)}</dd>
              </div>
              {applied && (
                <div className="chk-bill-row" style={{ color: "var(--ok, #28c840)" }}>
                  <dt>referral {applied}</dt>
                  <dd>− {inr(quote.discount)}</dd>
                </div>
              )}
              <div className="chk-bill-row">
                <dt>Tax ({Math.round(quote.taxRate * 100)}%)</dt>
                <dd>+ {inr(quote.taxInr)}</dd>
              </div>
              <div className="chk-bill-row" style={{ fontWeight: 700, borderTop: "1px solid var(--border)", paddingTop: 10, marginTop: 10 }}>
                <dt>Total</dt>
                <dd>{inr(quote.totalInr)}</dd>
              </div>
            </div>
            <button type="button" className="chk-pay" onClick={payNow} disabled={phase !== "review"} style={{ marginTop: 16 }}>
              {phase === "ordering" ? "Preparing…" : phase === "verifying" ? "Verifying…" : phase === "done" ? "Paid ✓" : `Pay ${inr(quote.totalInr)}`}
            </button>
            {!rzpReady && phase === "review" && <p className="chk-hint" style={{ marginTop: 8 }}>Loading payment gateway… please wait</p>}
            {error && (
              <p className="chk-error" role="alert" style={{ marginTop: 10 }}>
                {error}
              </p>
            )}
            <p className="chk-note">Secured by Razorpay — no card stored with us.</p>
          </aside>
        </div>
      </div>
    );
  }

  const canIncrease = nodes < max;
  const canDecrease = nodes > min;

  return (
    <div className="chk-page">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" onLoad={() => setRzpReady(true)} />
      {phase === "creating" && (
        <div className="loading-overlay" aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 500 }}>
          <div className="loader">
            <span>
              <span />
              <span />
              <span />
              <span />
            </span>
            <div className="base">
              <span />
              <div className="face" />
            </div>
          </div>
          <div className="longfazers">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      )}
      <div className="chk-eyebrow">{"// checkout"}</div>
      <h1 className="chk-title">{isAddOn ? `Add nodes to your ${PLAN_NAMES[planId]} plan` : "Finish your purchase."}</h1>
      <p className="chk-sub">
        {isAddOn
          ? `Add ${nodes} extra node${nodes > 1 ? "s" : ""} at ${inr(pricing.perNodeInr)} each — you’ll pay only for the extra nodes.`
          : "Pick your node count, then enter billing details. You’ll review the locked price on the next step and pay directly with Razorpay — same page, no separate email."}
      </p>

      <div className="chk-grid">
        {/* left — billing form */}
        <form className="chk-card" onSubmit={submit}>
          <h2 className="chk-card-title">Billing address</h2>

          <label className="chk-field chk-field--span">
            <span className="chk-label">Email address</span>
            <input
              type="email"
              value={billing.email}
              onChange={(e) => setField("email", e.target.value)}
              required
              readOnly={!!authUser?.email}
              placeholder={authUser?.email ? authUser.email : "you@example.com"}
              style={authUser?.email ? { background: "var(--surface)", cursor: "not-allowed", color: "var(--muted)" } : undefined}
            />
            {authUser?.email ? <span className="chk-hint">Using your logged-in email — not editable</span> : null}
          </label>

          <div className="chk-fields">
            <label className="chk-field">
              <span className="chk-label">First name</span>
              <input
                type="text"
                value={billing.firstName}
                onChange={(e) => setField("firstName", e.target.value)}
                required
                placeholder="Jane"
              />
            </label>
            <label className="chk-field">
              <span className="chk-label">Last name</span>
              <input
                type="text"
                value={billing.lastName}
                onChange={(e) => setField("lastName", e.target.value)}
                required
                placeholder="Doe"
              />
            </label>

            <label className="chk-field chk-field--span">
              <span className="chk-label">Phone</span>
              <div className="chk-phone chk-phone--wide">
                <div
                  className="chk-phone-fixed"
                  aria-label={`Country code ${billing.phoneCode} for ${effectiveCountry}`}
                  title={`${effectiveCountry} · ${billing.phoneCode}`}
                >
                  <span aria-hidden="true">{COUNTRY_FLAGS[effectiveCountry] ?? "🌐"}</span>
                  <span>{billing.phoneCode}</span>
                </div>
                <input
                  type="tel"
                  value={billing.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                  placeholder={billing.phoneCode === "+91" ? "98765 43210" : "555 0100"}
                  autoComplete="tel"
                />
              </div>
            </label>
            <label className="chk-field chk-field--span">
              <span className="chk-label">Company (optional)</span>
              <input
                type="text"
                value={billing.company}
                onChange={(e) => setField("company", e.target.value)}
                placeholder="Acme Inc."
              />
            </label>

            <label className="chk-field chk-field--span">
              <span className="chk-label">Address line 1</span>
              <input
                type="text"
                value={billing.address1}
                onChange={(e) => setField("address1", e.target.value)}
                required
                placeholder="123, main street"
              />
            </label>
            <label className="chk-field">
              <span className="chk-label">Address line 2 (optional)</span>
              <input
                type="text"
                value={billing.address2}
                onChange={(e) => setField("address2", e.target.value)}
                placeholder="Apt, floor, landmark"
              />
            </label>
            <label className="chk-field">
              <span className="chk-label">City</span>
              <input
                type="text"
                value={billing.city}
                onChange={(e) => setField("city", e.target.value)}
                required
                placeholder={CITY_PLACEHOLDER[effectiveCountry] ?? "City"}
              />
            </label>
            <label className="chk-field">
              <span className="chk-label">
                {effectiveCountry === "India"
                  ? "State / UT"
                  : STATE_LABELS[effectiveCountry] ?? "State / Province"}
              </span>
              {effectiveCountry === "India" ? (
                <select
                  value={billing.state}
                  onChange={(e) => setField("state", e.target.value)}
                  required
                >
                  <option value="">Select a state</option>
                  {IN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              ) : statesLoading ? (
                <span className="chk-states-loading">loading…</span>
              ) : states?.length ? (
                <select
                  value={billing.state}
                  onChange={(e) => setField("state", e.target.value)}
                  required
                >
                  <option value="">Select a state / region</option>
                  {states.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={billing.state}
                  onChange={(e) => setField("state", e.target.value)}
                  required
                  placeholder="State / Province"
                />
              )}
            </label>
            <label className="chk-field">
              <span className="chk-label">Country</span>
              <div className="chk-country-fixed" aria-live="polite">
                <span aria-hidden="true">{COUNTRY_FLAGS[effectiveCountry] ?? "🌐"}</span>
                <span>{effectiveCountry ?? "Detecting…"}</span>
                <span className="chk-country-lock" aria-hidden="true" title="Locked to your IP">
                  <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3">
                    <rect x="3" y="5" width="6" height="5" rx="1" />
                    <path d="M4.5 5V3.7a1.5 1.5 0 0 1 3 0V5" />
                  </svg>
                </span>
              </div>
            </label>
            <label className="chk-field chk-field--pin">
              <span className="chk-label">PIN / ZIP</span>
              <div className="chk-pin-row">
                <input
                  type="text"
                  value={billing.postal}
                  onChange={(e) => {
                    setField("postal", e.target.value);
                    // keep live feedback after the first validation attempt
                    if (pinTouched && pinOk !== null) setPinOk(null);
                    // if already marked invalid for format, re-evaluate live after first touch
                    if (pinTouched && !pinBusy) {
                      // don't set invalid instantly while typing — let format check run,
                      // but clear a previous India-specific failure so a corrected PIN can re-verify
                      if (effectiveCountry === "India" && pinOk === false) setPinOk(null);
                    }
                  }}
                  onBlur={() => void verifyPin()}
                  required
                  aria-invalid={postalInvalid}
                  className={postalInvalid ? "is-invalid" : undefined}
                  placeholder={POSTAL_PLACEHOLDER[effectiveCountry] ?? "Postal code"}
                />
                {pinBusy && <span className="chk-pin-status">verifying…</span>}
                {!pinBusy && pinOk === true && !postalInvalid && (
                  <span className="chk-pin-status chk-pin-ok">✓ valid</span>
                )}
                {!pinBusy && postalInvalid && (
                  <span className="chk-pin-status chk-pin-bad">invalid</span>
                )}
              </div>
              {postalInvalid && (
                <span className="chk-hint chk-hint--error">Invalid postal code for {effectiveCountry}</span>
              )}
            </label>
          </div>

          {/* referral — extra space/padding above */}
          <label className="chk-field chk-referral-row">
            <span className="chk-label">Referral code (optional)</span>
            <div className="chk-referral">
              <input
                type="text"
                value={referral}
                onChange={(e) => setReferral(e.target.value)}
                placeholder="e.g. FENCE10"
              />
              <button type="button" className="chk-apply" onClick={applyReferral}>
                Apply
              </button>
            </div>
            {applied && (
              <span className="chk-hint chk-hint--ok">
                {applied} applied — {Math.round((quote.discount / quote.subtotalInr) * 100)}% off
              </span>
            )}
          </label>

          {error && (
            <p className="chk-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="chk-pay" disabled={phase === "creating"}>
            {phase === "creating" ? "Preparing review…" : `Continue to review · ${inr(quote.totalInr)}`}
          </button>
          <p className="chk-note">You’ll pay on the next step via Razorpay — no card stored with us.</p>
        </form>

        {/* right — order summary + node picker */}
        <aside className="chk-card chk-aside">
          <h2 className="chk-card-title">{isAddOn ? `Add to ${PLAN_NAMES[planId]}` : `${PLAN_NAMES[planId]} plan`}</h2>

          <div className="chk-nodes">
            <div className="chk-stepper" role="group" aria-label="Choose enforcement nodes">
              <button
                type="button"
                className="chk-stepper-btn"
                onClick={() => step(-1)}
                disabled={!canDecrease}
                aria-label="fewer nodes"
              >
                −
              </button>
              <span className="chk-stepper-count">{nodes}</span>
              <button
                type="button"
                className="chk-stepper-btn"
                onClick={() => step(1)}
                disabled={!canIncrease}
                aria-label="more nodes"
              >
                +
              </button>
            </div>
            <div className="chk-nodes-caption">
              <span>
                {isAddOn
                  ? `${nodes} extra node${nodes > 1 ? "s" : ""} to add`
                  : nodes === min
                    ? `${nodes} nodes included`
                    : `${min} included + ${nodes - min} extra node${nodes - min > 1 ? "s" : ""}`}
              </span>
              <span className="chk-nodes-rate">
                · {inr(pricing.perNodeInr)} per node · cap {max} {isAddOn ? "extra" : ""}
              </span>
            </div>
          </div>

          <div className="chk-order-divider" />
          {isAddOn ? (
            <div className="chk-order-row">
              <span>Add {nodes} node{nodes > 1 ? "s" : ""}</span>
              <span>{inr(quote.subtotalInr)}</span>
            </div>
          ) : (
            <>
              <div className="chk-order-row">
                <span>{min} nodes (included)</span>
                <span>{inr(quote.subtotalInr - (nodes - min) * pricing.perNodeInr)}</span>
              </div>
              {nodes > min && (
                <div className="chk-order-row">
                  <span>{nodes - min} extra node{nodes - min > 1 ? "s" : ""}</span>
                  <span>+ {inr((nodes - min) * pricing.perNodeInr)}</span>
                </div>
              )}
            </>
          )}
          {applied && (
            <div className="chk-order-row chk-disc">
              <span>referral {applied}</span>
              <span>− {inr(quote.discount)}</span>
            </div>
          )}
          {!!quote.taxInr && (
            <div className="chk-order-row">
              <span>tax ({Math.round(quote.taxRate * 100)}% · {effectiveCountry})</span>
              <span>+ {inr(quote.taxInr)}</span>
            </div>
          )}
          <div className="chk-order-total">
            <span>Total</span>
            <span>{inr(quote.totalInr)}</span>
          </div>
          <ul className="chk-order-list">
            <li>Pay what you see — amount locked in your magic link.</li>
            <li>Nodes and tax fixed at checkout, no surprises later.</li>
            <li>Secured by Razorpay — we never store your card.</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
