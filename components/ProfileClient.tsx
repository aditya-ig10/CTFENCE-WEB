"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import gsap from "gsap";
import { motionAllowed } from "@/lib/anim";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import Link from "next/link";
import { firebaseEnabled, getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";
import { PLAN_PRICING, type PlanId } from "@/lib/checkout";

// checkout-style profile — same visual system as /checkout: clean modern cards,
// Canela headings, JetBrains labels, INR pricing. Fetches live from Firebase:
// users/{uid} (profile + plan/nodes/expiresAt) and users/{uid}/transactions.

type ProfileFields = {
  firstName: string;
  lastName: string;
  email: string;
  photoURL: string;
  company: string;
  phoneDial: string;
  phoneNumber: string;
  plan: string;
  nodes: number | null;
  expiresAt: unknown;
  planPurchasedAt?: unknown;
};

const EMPTY: ProfileFields = {
  firstName: "",
  lastName: "",
  email: "",
  photoURL: "",
  company: "",
  phoneDial: "IN +91",
  phoneNumber: "",
  plan: "free",
  nodes: null,
  expiresAt: null,
  planPurchasedAt: null,
};

const DIAL_CODES = ["IN +91", "US +1", "GB +44", "AE +971", "SG +65", "AU +61", "DE +49", "OTHER"];

type Tx = {
  id: string;
  date: string;
  plan: string;
  nodes: number;
  amountInr: number;
  status: "paid" | "pending" | "failed";
  subtotalInr?: number;
  discountInr?: number;
  taxInr?: number;
  taxRate?: number;
  billing?: Record<string, unknown>;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt?: Date;
  expiresAt?: Date;
};

function formatDate(d: Date) {
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function addDays(d: Date, n: number) {
  return new Date(d.getTime() + n * 864e5);
}
function cleanPlaintext(val: unknown): string {
  if (typeof val !== "string" || !val) return "";
  if (/^v\d+:[0-9a-fA-F]+:[0-9a-fA-F]+/.test(val)) return "";
  return val;
}

async function downloadBill(tx: Tx, userFields: ProfileFields) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const billing = (tx.billing as Record<string, string>) ?? {};
  const createdAt = tx.createdAt ?? new Date();
  const expiresAt = tx.expiresAt ?? addDays(createdAt, 30);
  // try to load logo for header
  let logoData: string | null = null;
  try {
    const res = await fetch("/icon.png");
    if (res.ok) {
      const blob = await res.blob();
      logoData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  } catch {}
  // header — aligned as per screenshot: red bar with circular CF badge left, text right
  doc.setFillColor(255, 49, 68);
  doc.rect(0, 0, 210, 22, "F");
  const headerTextX = logoData ? 34 : 14;
  if (logoData) {
    try {
      // subtle darker circle behind logo to match the header badge
      doc.setFillColor(220, 35, 60);
      doc.circle(21, 11, 9, "F");
      doc.addImage(logoData, "PNG", 14.5, 4.5, 13, 13);
    } catch {}
  }
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Context Fence", headerTextX, 13);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text("Context Fence  •  Synthrun  •  contextfence.dev", headerTextX, 18);
  doc.setTextColor(0, 0, 0);

  // invoice meta
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("INVOICE", 14, 32);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Invoice #: ${tx.id.slice(0, 12).toUpperCase()}`, 14, 38);
  doc.text(`Date: ${formatDate(createdAt)}`, 14, 43);
  doc.text(`Expires: ${formatDate(expiresAt)}`, 14, 48);
  doc.text(`Status: ${tx.status.toUpperCase()}`, 14, 53);
  // bill from
  doc.setFont("helvetica", "bold");
  doc.text("From:", 14, 62);
  doc.setFont("helvetica", "normal");
  doc.text("Context Fence (Synthrun)", 14, 67);
  doc.text("New Delhi, India", 14, 72);
  doc.text("hello@synthrun.site", 14, 77);
  // bill to
  doc.setFont("helvetica", "bold");
  doc.text("Bill to:", 110, 62);
  doc.setFont("helvetica", "normal");
  const bFirst = cleanPlaintext(billing.firstName);
  const bLast = cleanPlaintext(billing.lastName);
  const bName = bFirst || bLast ? `${bFirst} ${bLast}`.trim() : "";
  const uName = `${cleanPlaintext(userFields.firstName)} ${cleanPlaintext(userFields.lastName)}`.trim();
  const toName = bName || uName || "Customer";
  doc.text(toName, 110, 67);
  const toEmail = cleanPlaintext(billing.email) || cleanPlaintext(userFields.email) || "";
  if (toEmail) doc.text(toEmail, 110, 72);
  const comp = cleanPlaintext(billing.company) || cleanPlaintext(userFields.company);
  if (comp) doc.text(comp, 110, 77);
  const addr = [
    cleanPlaintext(billing.address1),
    cleanPlaintext(billing.address2),
    cleanPlaintext(billing.city),
    cleanPlaintext(billing.state),
    cleanPlaintext(billing.postal),
    cleanPlaintext(billing.country),
  ].filter(Boolean).join(", ");
  if (addr) {
    const lines = doc.splitTextToSize(addr, 90);
    doc.text(lines, 110, 82);
  }
  const phone = cleanPlaintext(billing.phone);
  if (phone) doc.text(`${cleanPlaintext(billing.phoneCode)} ${phone}`.trim(), 110, 92);
  // line
  doc.setDrawColor(200);
  doc.line(14, 98, 196, 98);
  // table header
  let y = 106;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Item", 14, y);
  doc.text("Qty", 110, y);
  doc.text("Amount", 160, y);
  y += 6;
  doc.setDrawColor(230);
  doc.line(14, y - 4, 196, y - 4);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`${tx.plan}`, 14, y);
  doc.text(String(tx.nodes), 110, y);
  doc.text(`Rs. ${Number(tx.amountInr).toLocaleString("en-IN")}`, 160, y);
  y += 7;
  if (tx.subtotalInr !== undefined && tx.discountInr) {
    doc.setFontSize(9);
    doc.text(`Subtotal`, 14, y);
    doc.text(`Rs. ${Number(tx.subtotalInr).toLocaleString("en-IN")}`, 160, y);
    y += 5;
    doc.text(`Discount`, 14, y);
    doc.text(`- Rs. ${Number(tx.discountInr).toLocaleString("en-IN")}`, 160, y);
    y += 5;
  }
  if (tx.taxInr) {
    doc.setFontSize(9);
    doc.text(`Tax (${Math.round((tx.taxRate ?? 0) * 100)}%)`, 14, y);
    doc.text(`Rs. ${Number(tx.taxInr).toLocaleString("en-IN")}`, 160, y);
    y += 5;
  }
  y += 2;
  doc.setDrawColor(0);
  doc.line(14, y - 4, 196, y - 4);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Total", 14, y);
  doc.text(`Rs. ${Number(tx.amountInr).toLocaleString("en-IN")}`, 160, y);
  y += 10;
  // payment info
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  if (tx.razorpayOrderId) {
    doc.text(`Razorpay Order: ${tx.razorpayOrderId}`, 14, y);
    y += 5;
  }
  if (tx.razorpayPaymentId) {
    doc.text(`Payment ID: ${tx.razorpayPaymentId}`, 14, y);
    y += 5;
  }
  doc.text(`Payment Status: ${tx.status}`, 14, y);
  y += 10;
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("Thank you for using Context Fence. This is a computer-generated invoice.", 14, y);
  doc.text("For support: hello@synthrun.site", 14, y + 5);
  doc.save(`ContextFence-Invoice-${tx.id.slice(0, 8)}.pdf`);
}

export default function ProfileClient() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [fields, setFields] = useState<ProfileFields>(EMPTY);
  const [state, setState] = useState<"loading" | "ready" | "missing" | "saving" | "saved" | "error">("loading");
  const [txs, setTxs] = useState<Tx[] | null>(null);

  useEffect(() => {
    if (!firebaseEnabled) {
      setAuthReady(true);
      return;
    }
    const auth = getFirebaseAuth();
    if (!auth) {
      setAuthReady(true);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    const db = getFirebaseDb();
    if (!db) return;
    let cancelled = false;
    (async () => {
      setState("loading");
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (cancelled) return;
        if (snap.exists()) {
          const d = snap.data() as Partial<ProfileFields>;
          const gName = user.displayName ?? "";
          const [gFirst = "", ...gRest] = gName.split(" ");
          setFields({
            ...EMPTY,
            ...d,
            firstName: cleanPlaintext(d.firstName) || gFirst,
            lastName: cleanPlaintext(d.lastName) || gRest.join(" "),
            company: cleanPlaintext(d.company),
            phoneNumber: cleanPlaintext(d.phoneNumber),
            email: cleanPlaintext(d.email) || user.email || "",
            phoneDial: d.phoneDial || "IN +91",
            plan: (d.plan as string) || "free",
            nodes: typeof d.nodes === "number" ? d.nodes : null,
            expiresAt: d.expiresAt ?? null,
            planPurchasedAt: d.planPurchasedAt || (d as Record<string, unknown>).planCreatedAt || (d as Record<string, unknown>).createdAt || null,
          });
          setState("ready");
        } else {
          const name = user.displayName ?? "";
          const [firstName = "", ...rest] = name.split(" ");
          setFields({
            ...EMPTY,
            firstName,
            lastName: rest.join(" "),
            email: user.email ?? "",
            photoURL: user.photoURL ?? "",
          });
          setState("missing");
        }
        // transactions — primary: top-level payments table (separate from user doc)
        // stores userId + billing + expiresAt per checkout; fallback to legacy subcollection
        try {
          let rows: Tx[] | null = null;
          try {
            const q = query(collection(db, "payments"), where("userId", "==", user.uid), limit(20));
            const ts = await getDocs(q);
            if (!ts.empty) {
              const mapped = ts.docs
                .map((docSnap) => {
                  const d = docSnap.data() as Record<string, unknown>;
                  const dt: Date = (d.createdAt as { toDate?: () => Date })?.toDate?.() ?? new Date();
                  const exp = (d.expiresAt as { toDate?: () => Date })?.toDate?.() ?? undefined;
                  return {
                    id: docSnap.id,
                    dt,
                    plan: String(d.plan ? `${String(d.plan)} · ${String((d.nodes as number) ?? "")} nodes` : "—"),
                    nodes: Number((d.nodes as number) ?? 0),
                    amountInr: Number((d.amountInr as number) ?? (d.amount as number) ?? 0),
                    status: (d.status as Tx["status"]) ?? "paid",
                    subtotalInr: Number((d.subtotalInr as number) ?? Number((d.amountInr as number) ?? 0)),
                    discountInr: Number((d.discountInr as number) ?? 0),
                    taxInr: Number((d.taxInr as number) ?? 0),
                    taxRate: Number((d.taxRate as number) ?? 0),
                    billing: (d.billing as Record<string, unknown>) ?? {},
                    razorpayOrderId: String(d.razorpayOrderId ?? ""),
                    razorpayPaymentId: String(d.razorpayPaymentId ?? ""),
                    createdAt: dt,
                    expiresAt: exp,
                  };
                })
                .sort((a, b) => b.dt.getTime() - a.dt.getTime())
                .slice(0, 8);
              rows = mapped.map(({ dt, ...rest }) => ({ ...rest, date: formatDate(dt) })) as Tx[];
            }
          } catch {
            // payments query may need permission; fall through to legacy
          }
          if (rows && rows.length) {
            if (!cancelled) setTxs(rows);
          } else {
            // legacy fallback
            const q2 = query(collection(db, "users", user.uid, "transactions"), orderBy("createdAt", "desc"), limit(8));
            const ts2 = await getDocs(q2);
            if (!cancelled) {
              if (!ts2.empty) {
                const rows2: Tx[] = ts2.docs.map((docSnap) => {
                  const d = docSnap.data() as Record<string, unknown>;
                  const dt: Date = (d.createdAt as { toDate?: () => Date })?.toDate?.() ?? new Date();
                  return {
                    id: docSnap.id,
                    date: formatDate(dt),
                    plan: String(d.plan ?? "—"),
                    nodes: Number((d.nodes as number) ?? 0),
                    amountInr: Number((d.amountInr as number) ?? (d.amount as number) ?? 0),
                    status: (d.status as Tx["status"]) ?? "paid",
                  };
                });
                setTxs(rows2);
              } else {
                setTxs(null);
              }
            }
          }
        } catch {
          if (!cancelled) setTxs(null);
        }
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!motionAllowed()) return;
    const ctx = gsap.context(() => {
      gsap.from(".chk-card", { y: 18, opacity: 0, duration: 0.6, ease: "power3.out", stagger: 0.08, clearProps: "all" });
      gsap.from(".chk-title, .chk-eyebrow", { y: 12, opacity: 0, duration: 0.5, ease: "power3.out", stagger: 0.06, clearProps: "all" });
      gsap.from(".chk-bill-row, .tx-table tr", { x: -8, opacity: 0, duration: 0.4, ease: "power3.out", stagger: 0.03, clearProps: "all" });
    });
    return () => ctx.revert();
  }, [authReady, state]);

  async function save() {
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    if (!auth?.currentUser || !db) return;
    setState("saving");
    try {
      const payload = {
        firstName: fields.firstName,
        lastName: fields.lastName,
        email: fields.email,
        photoURL: auth.currentUser.photoURL ?? fields.photoURL,
        company: fields.company,
        phoneDial: fields.phoneDial,
        phoneNumber: fields.phoneNumber,
        updatedAt: serverTimestamp(),
      } as Record<string, unknown>;
      await setDoc(doc(db, "users", auth.currentUser.uid), payload, { merge: true });
      setState("saved");
      setTimeout(() => setState("ready"), 1800);
    } catch {
      setState("error");
    }
  }

  const planId = (fields.plan === "starter" || fields.plan === "teams" ? fields.plan : "free") as PlanId | "free";
  const isPaid = planId !== "free";
  const pricing = isPaid ? PLAN_PRICING[planId as PlanId] : null;

  const effectiveNodes = useMemo(() => {
    if (fields.nodes !== null) return fields.nodes;
    if (pricing) return pricing.minNodes;
    return 1;
  }, [fields.nodes, pricing]);

const expiryDate = useMemo(() => {
    if (!isPaid) return null;
    const raw = fields.expiresAt as { toDate?: () => Date } | string | number | null | undefined;
    if (raw && typeof raw === "object" && "toDate" in raw && typeof (raw as { toDate?: unknown }).toDate === "function") {
      try {
        return (raw as { toDate: () => Date }).toDate();
      } catch {
        return null;
      }
    }
    if (typeof raw === "string" || typeof raw === "number") {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) return d;
    }
    // default: 30 days from now, end of day
    return addDays(new Date(), 30);
  }, [fields.expiresAt, isPaid]);

  const planPurchasedDate = useMemo(() => {
    if (!isPaid) return null;
    const raw = fields.planPurchasedAt as { toDate?: () => Date } | string | number | null | undefined;
    if (raw && typeof raw === "object" && "toDate" in raw && typeof (raw as { toDate?: unknown }).toDate === "function") {
      try {
        return (raw as { toDate: () => Date }).toDate();
      } catch {
        return null;
      }
    }
    if (typeof raw === "string" || typeof raw === "number") {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  }, [fields.planPurchasedAt, isPaid]);

  const planPurchasedLabel = planPurchasedDate ? formatDate(planPurchasedDate) : null;
  const expiryLabel = !isPaid ? "No expiry — free forever" : expiryDate ? formatDate(expiryDate) : "—";
  const planNames: Record<string, string> = { free: "Free plan", starter: "Starter plan", teams: "Teams plan" };
  const planLabel = planNames[fields.plan] ?? `${fields.plan} plan`;
  const perNodeInr = pricing?.perNodeInr ?? 0;
  const subtotalInr = isPaid ? perNodeInr * effectiveNodes : 0;
  const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

  // only real firebase transactions — no mock fallback
  const displayTxs: Tx[] = useMemo(() => txs ?? [], [txs]);

  if (!authReady || (user && state === "loading")) {
    return (
      <div className="chk-page">
        <div className="loading-overlay" aria-hidden="true">
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
        <div className="chk-card" style={{ textAlign: "center", padding: 32 }}>
          <p className="chk-hint">loading your profile…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="chk-page">
        <div className="chk-card" style={{ textAlign: "center", padding: 32 }}>
          <h1 className="chk-title" style={{ fontSize: 28, marginBottom: 8 }}>
            Not signed in.
          </h1>
          <p className="chk-sub" style={{ margin: "0 auto 18px" }}>
            Use the login button in the top bar to sign in with Google, then come back here.
          </p>
          <Link href="/" className="chk-pay" style={{ display: "inline-flex", width: "auto", padding: "12px 24px", textDecoration: "none" }}>
            Back to the site
          </Link>
        </div>
      </div>
    );
  }

  const avatar = fields.photoURL || user.photoURL;

  return (
    <div className="chk-page">
      {state === "saving" && (
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
      <div className="chk-eyebrow">{"// profile"}</div>
      <h1 className="chk-title">Your profile</h1>
      <p className="chk-sub">
        Signed in as <strong>{fields.email || user.email}</strong> · Manage your plan, nodes and billing.
      </p>

      <div className="chk-grid" style={{ marginTop: 12, marginBottom: 12, gap: 24 }}>
        {/* merged — profile + account details in one card */}
        <div className="chk-card" style={{ paddingTop: 28, paddingBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 18, paddingBottom: 18, borderBottom: "1px solid var(--border)" }}>
            {avatar ? (
              <img
                src={avatar}
                alt=""
                referrerPolicy="no-referrer"
                style={{ width: 56, height: 56, borderRadius: "50%", border: "1px solid var(--border)", objectFit: "cover", flex: "none" }}
              />
            ) : (
              <span
                aria-hidden="true"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: "var(--accent)",
                  color: "#fff",
                  fontFamily: "var(--font-jetbrains), 'JetBrains Mono', monospace",
                  fontWeight: 700,
                  fontSize: 20,
                  flex: "none",
                }}
              >
                {(fields.firstName || "U").charAt(0).toUpperCase()}
              </span>
            )}
            <div style={{ minWidth: 0, flex: "1 1 160px" }}>
              <div style={{ fontFamily: "var(--font-canela)", fontSize: 18, fontWeight: 700, color: "var(--bright)", lineHeight: 1.1 }}>
                {fields.firstName || "Your"} {fields.lastName || "profile"}
              </div>
              <div style={{ fontFamily: "var(--font-jetbrains), 'JetBrains Mono', monospace", fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{fields.email || user.email}</div>
            </div>
            <span className="plan-chip" data-plan={fields.plan} style={{ marginLeft: "auto" }}>
              {planLabel}
            </span>
          </div>
          <h2 className="chk-card-title" style={{ fontSize: 14, marginBottom: 14, color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Account details
          </h2>
          <div className="chk-fields">
            <label className="chk-field">
              <span className="chk-label">First name</span>
              <input type="text" value={fields.firstName} onChange={(e) => setFields((p) => ({ ...p, firstName: e.target.value }))} />
            </label>
            <label className="chk-field">
              <span className="chk-label">Last name</span>
              <input type="text" value={fields.lastName} onChange={(e) => setFields((p) => ({ ...p, lastName: e.target.value }))} />
            </label>
            <label className="chk-field chk-field--span">
              <span className="chk-label">Email</span>
              <input type="email" value={fields.email || user.email || ""} readOnly />
            </label>
            <span className="chk-hint" style={{ gridColumn: "1 / -1", marginTop: -6 }}>
              Email is synced from your Google account
            </span>

            <label className="chk-field">
              <span className="chk-label">Dial code</span>
              <select value={fields.phoneDial} onChange={(e) => setFields((p) => ({ ...p, phoneDial: e.target.value }))}>
                {DIAL_CODES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="chk-field">
              <span className="chk-label">Phone number</span>
              <input type="tel" value={fields.phoneNumber} onChange={(e) => setFields((p) => ({ ...p, phoneNumber: e.target.value }))} />
            </label>

            <label className="chk-field chk-field--span">
              <span className="chk-label">Company</span>
              <input type="text" value={fields.company} onChange={(e) => setFields((p) => ({ ...p, company: e.target.value }))} placeholder="Acme Inc." />
            </label>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 18, justifyContent: "flex-end" }}>
            {state === "saved" && <span className="chk-hint chk-hint--ok">saved ✓</span>}
            {state === "error" && (
              <span className="chk-hint" style={{ color: "var(--accent)" }}>
                save failed — try again
              </span>
            )}
            <button type="button" className="chk-pay" style={{ width: "auto", padding: "12px 28px", marginTop: 0 }} onClick={save} disabled={state === "saving"}>
              {state === "saving" ? "Saving…" : "Save Profile"}
            </button>
          </div>
        </div>

        {/* right — plan, nodes, billing */}
        <div className="chk-card chk-aside" style={{ paddingTop: 28, paddingBottom: 28 }}>
          <h2 className="chk-card-title">Current plan</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <span style={{ fontFamily: "var(--font-canela)", fontSize: 22, fontWeight: 700, color: "var(--bright)" }}>{planLabel.replace(" plan", "")}</span>
            <span className="plan-chip" data-plan={fields.plan}>
              {effectiveNodes} nodes
            </span>
          </div>
          <div className="chk-hint" style={{ margin: "0 0 14px", lineHeight: 1.6 }}>
            {isPaid ? (
              <>
                <div>{effectiveNodes} enforcement nodes · {inr(perNodeInr)} / node</div>
                <div>Subtotal {inr(subtotalInr)}/mo</div>
              </>
            ) : (
              "1 node · local only · 7-day retention · Free forever"
            )}
          </div>

          <div className="chk-order-divider" />

          {isPaid ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
              <span className="chk-hint">
                {effectiveNodes} nodes · {inr(perNodeInr)} / extra node
              </span>
              <Link
                href={`/checkout?plan=${planId}&addNodes=1`}
                className="chk-apply"
                style={{ textDecoration: "none", padding: "8px 14px" }}
                title={`Buy 1 extra node — ${inr(perNodeInr)}`}
              >
                Buy 1 node — {inr(perNodeInr)}
              </Link>
            </div>
          ) : (
            <p className="chk-hint" style={{ marginBottom: 10 }}>
              Unlimited policies — nodes is the only axis. <Link href="/checkout?plan=starter" style={{ color: "var(--accent)" }}>Upgrade</Link> to add more.
            </p>
          )}

          <div className="chk-bill chk-bill--canela" style={{ margin: "14px 0 0" }}>
            <div className="chk-bill-row">
              <dt>Plan</dt>
              <dd>{planLabel}</dd>
            </div>
            <div className="chk-bill-row">
              <dt>Nodes</dt>
              <dd>{effectiveNodes}</dd>
            </div>
            {isPaid && planPurchasedLabel && (
              <div className="chk-bill-row">
                <dt>Purchased on</dt>
                <dd>{planPurchasedLabel}</dd>
              </div>
            )}
            <div className="chk-bill-row">
              <dt>Expiring on</dt>
              <dd>{expiryLabel}</dd>
            </div>
            {isPaid && <div className="chk-bill-row"><dt>Per node</dt><dd>{inr(perNodeInr)}</dd></div>}
            <div className="chk-bill-row">
              <dt>Amount</dt>
              <dd>{isPaid ? `${inr(subtotalInr)}/mo` : "₹0"}</dd>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
            <Link href="/#pricing" className="chk-pay chk-outline" style={{ flex: "1 1 120px", textDecoration: "none", textAlign: "center", padding: "12px 16px", fontSize: 13 }}>
              View plans
            </Link>
            {planId === "free" ? (
              <Link href="/checkout?plan=starter" className="chk-pay" style={{ flex: "1 1 120px", textDecoration: "none", textAlign: "center", padding: "12px 16px", fontSize: 13 }}>
                Upgrade now
              </Link>
            ) : planId === "starter" ? (
              <Link href="/checkout?plan=teams" className="chk-pay" style={{ flex: "1 1 120px", textDecoration: "none", textAlign: "center", padding: "12px 16px", fontSize: 13 }}>
                Upgrade to Teams
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {/* full-width transactions — live from Firebase payments */}
      <div className="chk-card" style={{ marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
          <h2 className="chk-card-title" style={{ margin: 0 }}>
            Recent transactions
          </h2>
          <span className="chk-hint">{displayTxs.length} entries</span>
        </div>
        {displayTxs.length ? (
          <div style={{ overflowX: "auto" }}>
            <table className="tx-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Plan</th>
                  <th>Nodes</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Bill</th>
                </tr>
              </thead>
              <tbody>
                {displayTxs.map((t) => (
                  <tr key={t.id}>
                    <td>{t.date}</td>
                    <td>{t.plan}</td>
                    <td>{t.nodes}</td>
                    <td>₹{t.amountInr.toLocaleString("en-IN")}</td>
                    <td>
                      <span className={`tx-badge ${t.status === "paid" ? "tx-badge--paid" : t.status === "pending" ? "tx-badge--pending" : ""}`}>{t.status}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="chk-apply"
                        style={{ padding: "6px 12px", fontSize: 11, whiteSpace: "nowrap" }}
                        onClick={() => downloadBill(t, fields)}
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="tx-empty">No transactions yet — your payments will appear here.</div>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          <Link href="/downloads" className="chk-apply" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", padding: "10px 18px" }}>
            Download app
          </Link>
          <Link href="/#pricing" className="chk-apply" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", padding: "10px 18px" }}>
            Compare plans
          </Link>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", marginTop: 36, marginBottom: 24 }}>
        <button type="button" className="profile-signout" onClick={() => signOut(getFirebaseAuth()!)} style={{ padding: "12px 32px", fontSize: 12, borderWidth: 1.5 }}>
          Sign out
        </button>
      </div>
    </div>
  );
}
