"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { firebaseEnabled, getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";
import { PLAN_PRICING, type PlanId } from "@/lib/checkout";

type Device = {
  id: string;
  name: string;
  os: string;
  lastSeen: string;
  status: "online" | "offline";
  ip: string;
};

const MOCK_DEVICES: Device[] = [
  { id: "1", name: "MacBook Pro — Aditya", os: "macOS 14.5 · M3 Max", lastSeen: "2 min ago", status: "online", ip: "192.168.1.12" },
  { id: "2", name: "iPhone 15 Pro", os: "iOS 18.0", lastSeen: "1 hour ago", status: "offline", ip: "10.0.0.8" },
  { id: "3", name: "Ubuntu Server", os: "Ubuntu 22.04 · 64.71.12.5", lastSeen: "3 days ago", status: "offline", ip: "64.71.12.5" },
  { id: "4", name: "iPad Air", os: "iPadOS 18.0", lastSeen: "5 days ago", status: "offline", ip: "192.168.1.18" },
];

export default function DashboardClient() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [plan, setPlan] = useState<PlanId | "free">("free");
  const [nodes, setNodes] = useState(1);

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
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setAuthReady(true);
      if (u) {
        const db = getFirebaseDb();
        if (db) {
          try {
            const snap = await getDoc(doc(db, "users", u.uid));
            if (snap.exists()) {
              const d = snap.data() as Record<string, unknown>;
              setPlan((d.plan as PlanId) || "free");
              setNodes(typeof d.nodes === "number" ? d.nodes : 1);
            }
          } catch {}
        }
      }
    });
    return () => unsub();
  }, []);

  const pricing = plan !== "free" ? PLAN_PRICING[plan as PlanId] : null;
  const effectiveNodes = nodes;
  const devices = MOCK_DEVICES.slice(0, effectiveNodes);

  if (!authReady) {
    return (
      <div className="chk-page">
        <div className="chk-card" style={{ textAlign: "center", padding: 32 }}>
          <p className="chk-hint">loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="chk-page">
        <div className="chk-card" style={{ textAlign: "center", padding: 32 }}>
          <h1 className="chk-title" style={{ fontSize: 28, marginBottom: 8 }}>Sign in to manage devices</h1>
          <p className="chk-sub" style={{ margin: "0 auto 18px" }}>Your devices are tied to your Google account. Sign in to see and manage them.</p>
          <Link href="/profile" className="chk-pay" style={{ display: "inline-flex", width: "auto", padding: "12px 24px", textDecoration: "none" }}>Go to profile →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="chk-page">
      <div className="chk-eyebrow">{"// dashboard"}</div>
      <h1 className="chk-title">Your devices</h1>
      <p className="chk-sub">
        {effectiveNodes} device{effectiveNodes !== 1 ? "s" : ""} on <strong>{plan}</strong> · {pricing ? `${pricing.minNodes} included` : "free tier"} · Manage, rename or revoke.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16, marginBottom: 16 }}>
        <div className="chk-card" style={{ padding: "1.2rem 1.4rem", textAlign: "center" }}>
          <div style={{ fontFamily: "DM Mono, monospace", fontSize: "0.58rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink4)" }}>Online now</div>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: "1.8rem", fontWeight: 500, color: "var(--ink)", marginTop: 4 }}>{devices.filter((d) => d.status === "online").length}</div>
          <div style={{ fontFamily: "DM Mono, monospace", fontSize: "0.62rem", color: "var(--ink4)" }}>{devices.length} total slots</div>
        </div>
        <div className="chk-card" style={{ padding: "1.2rem 1.4rem", textAlign: "center" }}>
          <div style={{ fontFamily: "DM Mono, monospace", fontSize: "0.58rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink4)" }}>Plan</div>
          <div style={{ fontFamily: "Fraunces, serif", fontSize: "1.4rem", fontWeight: 500, color: "var(--ink)", marginTop: 4, textTransform: "capitalize" }}>{plan}</div>
          <div style={{ fontFamily: "DM Mono, monospace", fontSize: "0.62rem", color: "var(--ink4)" }}>{effectiveNodes} nodes</div>
        </div>
        <div className="chk-card" style={{ padding: "1.2rem 1.4rem", textAlign: "center", background: "var(--off)" }}>
          <div style={{ fontFamily: "DM Mono, monospace", fontSize: "0.58rem", letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink4)" }}>Need more?</div>
          <Link href="/checkout" style={{ display: "inline-flex", marginTop: 8, fontFamily: "DM Mono, monospace", fontSize: "0.68rem", fontWeight: 600, background: "var(--ink)", color: "var(--white)", padding: "0.5rem 1rem", borderRadius: 999, textDecoration: "none" }}>Add nodes →</Link>
        </div>
      </div>

      <div className="chk-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
          <h2 className="chk-card-title" style={{ margin: 0 }}>Devices on this account</h2>
          <span className="chk-hint">{devices.length} / {effectiveNodes} used</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {devices.map((d) => (
            <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "1rem 1.2rem", border: "1px solid var(--rule)", borderRadius: 12, background: "var(--white)" }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: d.status === "online" ? "#10b981" : "var(--ink4)", flexShrink: 0, boxShadow: d.status === "online" ? "0 0 8px rgba(16,185,129,0.4)" : "none" }} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontFamily: "Fraunces, serif", fontWeight: 500, fontSize: "0.95rem", color: "var(--ink)", lineHeight: 1.2 }}>{d.name}</div>
                <div style={{ fontFamily: "DM Mono, monospace", fontSize: "0.68rem", color: "var(--ink3)", marginTop: 2 }}>{d.os} · {d.ip} · last seen {d.lastSeen}</div>
              </div>
              <span style={{ fontFamily: "DM Mono, monospace", fontSize: "0.62rem", letterSpacing: "0.06em", textTransform: "uppercase", color: d.status === "online" ? "#10b981" : "var(--ink4)", background: d.status === "online" ? "rgba(16,185,129,0.1)" : "var(--off)", border: "1px solid var(--rule)", padding: "4px 8px", borderRadius: 999, whiteSpace: "nowrap" }}>{d.status}</span>
              <div style={{ display: "flex", gap: 6, marginLeft: 8 }}>
                <button type="button" className="chk-apply" style={{ padding: "6px 10px", fontSize: "0.62rem" }}>Rename</button>
                <button type="button" className="chk-apply" style={{ padding: "6px 10px", fontSize: "0.62rem", background: "rgba(239,68,68,0.06)", borderColor: "rgba(239,68,68,0.18)", color: "#ef4444" }}>Revoke</button>
              </div>
            </div>
          ))}
          {devices.length < effectiveNodes && (
            <button type="button" style={{ border: "1px dashed var(--rule)", borderRadius: 12, padding: "1rem", background: "transparent", fontFamily: "DM Mono, monospace", fontSize: "0.72rem", color: "var(--ink4)", cursor: "pointer", textAlign: "center" }}>+ Add new device · {effectiveNodes - devices.length} slot{effectiveNodes - devices.length !== 1 ? "s" : ""} left</button>
          )}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
          <Link href="/profile" className="chk-apply" style={{ textDecoration: "none", padding: "10px 18px" }}>← Back to profile</Link>
          <Link href="/downloads" className="chk-apply" style={{ textDecoration: "none", padding: "10px 18px", background: "var(--ink)", color: "var(--white)", borderColor: "var(--ink)" }}>Download app →</Link>
        </div>
      </div>
    </div>
  );
}
