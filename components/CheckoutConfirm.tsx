"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { addDoc, collection, doc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { firebaseEnabled, getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";
import type { BillingAddress, PlanId } from "@/lib/checkout";
import { PLAN_PRICING } from "@/lib/checkout";
import gsap from "gsap";
import { motionAllowed } from "@/lib/anim";

// step two of checkout: the one-time magic-link destination. verifies the token
// server-side, shows the locked node count + tax-inclusive amount, and settles
// via the razorpay modal. the order id comes from /api/create-order, which only
// accepts this signed token — so the price billed (subtotal − discount + tax,
// nodes baked in at checkout time) is immutable here.

type RazorpayHandlerResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
type RazorpayOptions = Record<string, unknown>;

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, cb: (r: unknown) => void) => void;
    };
  }
}

const PLAN_NAMES: Record<PlanId, string> = { starter: "Starter", teams: "Teams" };
const inr = (n: number) => "₹" + n.toLocaleString("en-IN");

const METHODS = [
  { id: "", label: "Any method" },
  { id: "card", label: "Card" },
  { id: "netbanking", label: "Netbanking" },
  { id: "wallet", label: "Wallet" },
  { id: "upi", label: "UPI" },
];

export default function CheckoutConfirm({ token }: { token: string }) {
  const router = useRouter();
  const userRef = useRef<User | null>(null);
  const [rzpReady, setRzpReady] = useState(false);
  const [state, setState] = useState<
    "loading" | "invalid" | "ready" | "ordering" | "modal" | "verifying" | "done"
  >("loading");
  const [claims, setClaims] = useState<{
    plan: PlanId;
    email: string;
    amount: number;
    currency: "INR";
    nodes: number;
    subtotalInr: number;
    discountInr: number;
    taxInr: number;
    taxRate: number;
    referralCode: string | null;
    billing: BillingAddress;
  } | null>(null);
  const [method, setMethod] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseEnabled) return;
    const auth = getFirebaseAuth();
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (u) => (userRef.current = u));
    return () => unsub();
  }, []);

  // razorpay checkout.js — loaded by <Script>, flipped ready via onLoad
  useEffect(() => {
    if (typeof window !== "undefined" && window.Razorpay) setRzpReady(true);
  }, []);

  useEffect(() => {
    if (!motionAllowed()) return;
    const ctx = gsap.context(() => {
      gsap.from(".chk-card", { y: 18, opacity: 0, duration: 0.6, ease: "power3.out", stagger: 0.08, clearProps: "all" });
      gsap.from(".chk-title, .chk-eyebrow", { y: 12, opacity: 0, duration: 0.5, ease: "power3.out", stagger: 0.06, clearProps: "all" });
    });
    return () => ctx.revert();
  }, [state, claims]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/verify-checkout-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (cancelled) return;
      if (!res.ok || !data.ok) return setState("invalid");
      setClaims({
        plan: data.plan,
        email: data.email,
        amount: data.amount,
        currency: data.currency,
        nodes: data.nodes,
        subtotalInr: data.subtotalInr,
        discountInr: data.discountInr ?? 0,
        taxInr: data.taxInr,
        taxRate: data.taxRate,
        referralCode: data.referralCode,
        billing: data.billing,
      });
      setState("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function syncPlan(paymentId: string, orderId: string) {
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();
    if (!claims || !auth?.currentUser || !db) return;
    const expiresAt = Timestamp.fromDate(new Date(Date.now() + 30 * 864e5)); // 30 days
    const now = serverTimestamp();
    try {
      // keep user doc as source of truth for current plan/nodes/expiry
      await setDoc(
        doc(db, "users", auth.currentUser.uid),
        {
          plan: claims.plan,
          nodes: claims.nodes,
          expiresAt,
          updatedAt: now,
          lastPaymentId: paymentId,
        },
        { merge: true }
      );
    } catch {
      /* best effort — payment is verified; sync can be redone later */
    }
    // separate payments table — one doc per checkout with full billing + expiry
    try {
      await addDoc(collection(db, "payments"), {
        userId: auth.currentUser.uid,
        email: claims.email,
        plan: claims.plan,
        nodes: claims.nodes,
        amountInr: claims.amount,
        subtotalInr: claims.subtotalInr,
        discountInr: claims.discountInr,
        taxInr: claims.taxInr,
        taxRate: claims.taxRate,
        referralCode: claims.referralCode,
        billing: claims.billing,
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        status: "paid",
        createdAt: now,
        expiresAt,
        expiresAtTime: expiresAt.toDate().toISOString(),
      });
      // also mirror to legacy per-user subcollection for backwards compat
      try {
        await setDoc(
          doc(db, "users", auth.currentUser.uid, "transactions", paymentId),
          {
            plan: claims.plan,
            nodes: claims.nodes,
            amountInr: claims.amount,
            amount: claims.amount,
            status: "paid",
            billing: claims.billing,
            createdAt: now,
            expiresAt,
          },
          { merge: true }
        );
      } catch {
        // non-fatal
      }
    } catch {
      // payments write is best-effort too — don't block navigation
    }
  }

  function pay() {
    setError(null);
    if (state !== "ready" || !rzpReady) {
      setError("payment script did not load yet — try again in a moment");
      return;
    }
    void (async () => {
      setState("ordering");
      try {
        const res = await fetch("/api/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          setError(
            data.error === "razorpay auth failed"
              ? "payment gateway misconfigured"
              : data.error || "could not start order"
          );
          setState("ready");
          return;
        }
        setState("modal");
        const rzp = new window.Razorpay!({
          key: data.keyId,
          order_id: data.orderId,
          amount: data.amount,
          currency: data.currency,
          name: "Context Fence",
          description: `${PLAN_NAMES[data.planId as PlanId]} · ${data.nodes} enforcement nodes`,
          theme: { color: "#ff3144" },
          ...(method ? { method } : {}),
          handler: (response: RazorpayHandlerResponse) => {
            setState("verifying");
            void (async () => {
              try {
                const vres = await fetch("/api/verify-payment", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(response),
                });
                const vdata = await vres.json();
                if (!vres.ok || !vdata.ok) {
                  setError("verification failed — contact us before retrying");
                  setState("ready");
                  return;
                }
                await syncPlan(response.razorpay_payment_id, response.razorpay_order_id);
                setState("done");
                router.push("/profile");
              } catch {
                setError("verification request failed — try again");
                setState("ready");
              }
            })();
          },
          modal: {
            ondismiss: () => {
              setState("ready");
              setError("checkout closed before payment — no charge was made");
            },
          },
        });
        rzp.on("payment.failed", () => {
          setState("ready");
          setError("the payment failed at the bank — try another method");
        });
        rzp.open();
      } catch {
        setError("could not reach the checkout service");
        setState("ready");
      }
    })();
  }

  // invalid / expired
  if (state === "invalid") {
    return (
      <div className="chk-page chk-center">
        <div className="chk-eyebrow">{"// checkout"}</div>
        <h1 className="chk-title">This link has expired.</h1>
        <p className="chk-sub">
          Checkout links are one-time and valid for 30 minutes. Start again to
          get a fresh one.
        </p>
        <a className="chk-pay" href="/checkout">
          Back to checkout
        </a>
      </div>
    );
  }

  if (state === "loading" || !claims) {
    return (
      <div className="chk-page chk-center">
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
        <p className="chk-note">Verifying your payment link…</p>
      </div>
    );
  }

  const b = claims.billing;
  const pricing = PLAN_PRICING[claims.plan];

  return (
    <div className="chk-page">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setRzpReady(true)}
      />
      {(state === "ordering" || state === "verifying" || state === "modal") && (
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
      <div className="chk-eyebrow">{"// secure payment"}</div>
      <h1 className="chk-title">Settle your {PLAN_NAMES[claims.plan]} plan.</h1>
      <p className="chk-sub">
        Amount locked for <strong>{inr(claims.amount)}</strong> · paying as{" "}
        <strong>{claims.email}</strong>.
      </p>

      <div className="chk-grid">
        <div className="chk-card">
          <h2 className="chk-card-title">Billing</h2>
                    <dl className="chk-bill">
            <div className="chk-bill-row">
              <dt>Payer</dt>
              <dd>
                {[b.firstName, b.lastName].filter(Boolean).join(" ") || claims.email}
              </dd>
            </div>
            <div className="chk-bill-row">
              <dt>Email</dt>
              <dd>{claims.email}</dd>
            </div>
            {[b.firstName, b.lastName].some(Boolean) && (
              <div className="chk-bill-row">
                <dt>Name</dt>
                <dd>{[b.firstName, b.lastName].filter(Boolean).join(" ")}</dd>
              </div>
            )}
                        {b.phone && (
              <div className="chk-bill-row">
                <dt>Phone</dt>
                <dd>{[b.phoneCode || "+91", b.phone].join(" ")}</dd>
              </div>
            )}
            {b.company && (
              <div className="chk-bill-row">
                <dt>Company</dt>
                <dd>{b.company}</dd>
              </div>
            )}
            <div className="chk-bill-row">
              <dt>Address</dt>
              <dd>
                {[
                  b.address1,
                  b.address2,
                  b.city,
                  b.state,
                  b.postal,
                  b.country,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </dd>
            </div>
          </dl>

          <div className="chk-field">
            <span className="chk-label">Enforcement nodes (locked)</span>
            <div className="chk-nodes-locked">
              <span className="chk-nodes-count">{claims.nodes}</span>
              <span className="chk-note">
                {claims.nodes === pricing.minNodes
                  ? `${pricing.minNodes} included nodes`
                  : `${pricing.minNodes} included + ${claims.nodes - pricing.minNodes} extra`}
              </span>
            </div>
          </div>

          <div className="chk-field">
            <span className="chk-label">Payment method</span>
            <div
              className="chk-methods"
              role="radiogroup"
              aria-label="Payment method"
            >
              {METHODS.map((m) => (
                <button
                  type="button"
                  role="radio"
                  aria-checked={method === m.id}
                  className={`chk-method${method === m.id ? " is-active" : ""}`}
                  onClick={() => setMethod(m.id)}
                  key={m.id}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <span className="chk-note">
              Preselects the method in Razorpay; they settle it.
            </span>
          </div>
        </div>

        <aside className="chk-card chk-aside">
          <h2 className="chk-card-title">Amount due (locked)</h2>
          <div className="chk-summary">
            <div className="chk-order-row">
              <span>
                {PLAN_NAMES[claims.plan]} · {claims.nodes} nodes
              </span>
              <span>{inr(claims.subtotalInr)}</span>
            </div>
            {!!claims.discountInr && (
              <div className="chk-order-row chk-disc">
                <span>referral ({claims.referralCode})</span>
                <span>− {inr(claims.discountInr)}</span>
              </div>
            )}
            <div className="chk-order-row">
              <span>tax ({Math.round(claims.taxRate * 100)}%)</span>
              <span>+ {inr(claims.taxInr)}</span>
            </div>
            <div className="chk-summary-total">
              <span>Total</span>
              <span>{inr(claims.amount)}</span>
            </div>
          </div>
          <button
            type="button"
            className="chk-pay"
            onClick={pay}
            disabled={state !== "ready"}
          >
            {state === "ordering" && "Preparing…"}
            {state === "modal" && "Complete in the modal…"}
            {state === "verifying" && "Verifying…"}
            {state === "done" && "Paid ✓"}
            {state === "ready" && `Pay ${inr(claims.amount)}`}
          </button>
          {error && (
            <p className="chk-error" role="alert">
              {error}
            </p>
          )}
          <p className="chk-note">
            Secure checkout by Razorpay · no card is stored with us.
          </p>
        </aside>
      </div>
    </div>
  );
}
