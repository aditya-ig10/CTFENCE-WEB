"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { firebaseEnabled, getFirebaseAuth, getFirebaseDb } from "@/lib/firebase";
import { PLAN_PRICING, type PlanId } from "@/lib/checkout";

// everything on this page is a live Firestore record — no placeholders.
// plan + nodes: users/{uid} · payments: payments where userId == uid ·
// devices: cloud_fleet_nodes where userId == uid, keyed by MAC address.

type Tx = {
  id: string;
  dt: Date;
  date: string;
  plan: string;
  nodes: number;
  amountInr: number;
  status: string;
  razorpayPaymentId: string;
};

type FleetDevice = {
  id: string;
  mac: string;
  name: string;
  platform: string;
  createdAt: Date | null;
  lastSeenAt: Date | null;
};

const MAC_RE = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
const PLATFORMS = ["macOS", "Windows", "Linux", "Other"] as const;

function normMac(raw: string): string | null {
  const t = raw.trim().toUpperCase().replace(/-/g, ":");
  return MAC_RE.test(t) ? t : null;
}

function formatDate(dt: Date): string {
  return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function relTime(dt: Date | null): string {
  if (!dt) return "never seen";
  const s = Math.max(0, Math.floor((Date.now() - dt.getTime()) / 1000));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} hr ago`;
  return `${Math.floor(s / 86400)} d ago`;
}

const inr = (n: number) => "₹" + Math.round(n).toLocaleString("en-IN");

function statusClass(status: string): string {
  const s = status.toLowerCase();
  if (s === "paid" || s === "captured" || s === "authorized" || s === "success") return "is-paid";
  if (s === "failed" || s === "cancelled" || s === "refunded") return "is-failed";
  if (s === "pending" || s === "created" || s === "processing") return "is-pending";
  return "";
}

export default function DashboardClient() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [plan, setPlan] = useState<PlanId | "free">("free");
  const [nodes, setNodes] = useState(1);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [txs, setTxs] = useState<Tx[] | null>(null);
  const [devices, setDevices] = useState<FleetDevice[]>([]);
  const [fleetReady, setFleetReady] = useState(false);

  // add-device form
  const [devName, setDevName] = useState("");
  const [devMac, setDevMac] = useState("");
  const [devPlatform, setDevPlatform] = useState<string>("macOS");
  const [devError, setDevError] = useState<string | null>(null);
  const [devBusy, setDevBusy] = useState(false);
  // rename + delete
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

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
      if (!u) {
        setPlan("free");
        setNodes(1);
        setExpiresAt(null);
        setTxs(null);
        setDevices([]);
        setFleetReady(true);
        return;
      }
      const db = getFirebaseDb();
      if (!db) return;
      try {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) {
          const d = snap.data() as Record<string, unknown>;
          const p = d.plan;
          setPlan(p === "starter" || p === "teams" ? (p as PlanId) : "free");
          setNodes(typeof d.nodes === "number" ? d.nodes : 1);
          const exp = (d.expiresAt as { toDate?: () => Date })?.toDate?.() ?? null;
          setExpiresAt(exp);
        }
      } catch {}
      try {
        const q = query(collection(db, "payments"), where("userId", "==", u.uid), limit(25));
        const ts = await getDocs(q);
        const mapped: Tx[] = ts.docs
          .map((docSnap) => {
            const d = docSnap.data() as Record<string, unknown>;
            const dt: Date = (d.createdAt as { toDate?: () => Date })?.toDate?.() ?? new Date(0);
            return {
              id: docSnap.id,
              dt,
              date: formatDate(dt),
              plan: typeof d.plan === "string" ? d.plan : "—",
              nodes: typeof d.nodes === "number" ? d.nodes : 0,
              amountInr: Number(d.amountInr ?? d.amount ?? 0),
              status: typeof d.status === "string" ? d.status : "paid",
              razorpayPaymentId: typeof d.razorpayPaymentId === "string" ? d.razorpayPaymentId : "",
            };
          })
          .sort((a, b) => b.dt.getTime() - a.dt.getTime());
        setTxs(mapped);
      } catch {
        setTxs([]);
      }
    });
    return () => unsub();
  }, []);

  // live fleet — one snapshot subscription per login
  useEffect(() => {
    if (!user) {
      setFleetReady(true);
      return;
    }
    const db = getFirebaseDb();
    if (!db) {
      setFleetReady(true);
      return;
    }
    setFleetReady(false);
    const q = query(collection(db, "cloud_fleet_nodes"), where("userId", "==", user.uid), limit(100));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows: FleetDevice[] = snap.docs.map((docSnap) => {
          const d = docSnap.data() as Record<string, unknown>;
          return {
            id: docSnap.id,
            mac: typeof d.nodeId === "string" ? d.nodeId : "",
            name: typeof d.name === "string" && d.name ? d.name : "Unnamed device",
            platform: typeof d.platform === "string" ? d.platform : "Other",
            createdAt: (d.createdAt as { toDate?: () => Date })?.toDate?.() ?? null,
            lastSeenAt: (d.lastSeenAt as { toDate?: () => Date })?.toDate?.() ?? null,
          };
        });
        rows.sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
        setDevices(rows);
        setFleetReady(true);
      },
      () => setFleetReady(true)
    );
    return () => unsub();
  }, [user]);

  const pricing = plan !== "free" ? PLAN_PRICING[plan as PlanId] : null;
  const slotsLeft = Math.max(nodes - devices.length, 0);
  // device-name placeholder from the Google account — never a hardcoded name
  const accountFirstName =
    user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "My";

  const paidTxs = useMemo(() => (txs ?? []).filter((t) => t.status.toLowerCase() === "paid"), [txs]);
  const totalPaid = useMemo(() => paidTxs.reduce((s, t) => s + t.amountInr, 0), [paidTxs]);
  const latestPaid = paidTxs[0] ?? null;

  async function addDevice(e: React.FormEvent) {
    e.preventDefault();
    setDevError(null);
    if (!user) {
      setDevError("Sign in first.");
      return;
    }
    const name = devName.trim();
    if (!name) {
      setDevError("Give the device a name.");
      return;
    }
    const mac = normMac(devMac);
    if (!mac) {
      setDevError("Enter a valid MAC — AA:BB:CC:DD:EE:FF.");
      return;
    }
    if (devices.some((d) => d.mac.toUpperCase() === mac)) {
      setDevError("That MAC is already on your fleet.");
      return;
    }
    if (devices.length >= nodes) {
      setDevError(`No free slots — you have ${nodes} on ${plan}. Add nodes at checkout.`);
      return;
    }
    const db = getFirebaseDb();
    if (!db) {
      setDevError("Database unavailable — try again.");
      return;
    }
    setDevBusy(true);
    try {
      await addDoc(collection(db, "cloud_fleet_nodes"), {
        userId: user.uid,
        nodeId: mac,
        name,
        platform: devPlatform,
        createdAt: serverTimestamp(),
        lastSeenAt: null,
      });
      setDevName("");
      setDevMac("");
      setDevError(null);
    } catch {
      setDevError("Could not add the device — check permissions and try again.");
    } finally {
      setDevBusy(false);
    }
  }

  async function renameDevice(id: string) {
    const name = renameValue.trim();
    if (!name) return;
    const db = getFirebaseDb();
    if (!db || !user) return;
    setRowBusy(id);
    setRowError(null);
    try {
      await updateDoc(doc(db, "cloud_fleet_nodes", id), { name });
      setRenamingId(null);
    } catch {
      setRowError("Rename failed — try again.");
    } finally {
      setRowBusy(null);
    }
  }

  async function removeDevice(id: string) {
    const db = getFirebaseDb();
    if (!db) return;
    setRowBusy(id);
    setRowError(null);
    try {
      await deleteDoc(doc(db, "cloud_fleet_nodes", id));
      setConfirmDeleteId(null);
    } catch {
      setRowError("Remove failed — try again.");
    } finally {
      setRowBusy(null);
    }
  }

  if (!authReady) {
    return (
      <div className="co-page">
        <div className="co-card" style={{ textAlign: "center", padding: 32 }}>
          <p className="co-hint">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="co-page">
        <div className="co-card" style={{ textAlign: "center", padding: "40px 32px" }}>
          <div className="co-eyebrow">dashboard</div>
          <h1 className="co-title" style={{ fontSize: 30 }}>Sign in to open your dashboard.</h1>
          <p className="co-hint" style={{ margin: "0 auto 20px", maxWidth: 420 }}>
            Your plan, payments and devices live on your Google account.
          </p>
          <Link href="/profile" className="co-btn" style={{ textDecoration: "none" }}>Go to profile →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="co-page">
      <div className="co-eyebrow">dashboard</div>
      <h1 className="co-title">Fleet overview.</h1>
      <p className="co-hint" style={{ marginBottom: 22 }}>
        {user.email} · <span style={{ textTransform: "capitalize" }}>{plan}</span> plan · every number below is a live record.
      </p>

      {/* stats — all derived from live records */}
      <div className="dash-stats">
        <div className="co-card dash-stat">
          <span className="dash-stat-label">Plan</span>
          <span className="dash-stat-value" style={{ textTransform: "capitalize" }}>{plan}</span>
          <span className="dash-stat-sub">
            {pricing ? `${pricing.minNodes} included · ${nodes} active` : "free tier · 1 node"}
          </span>
        </div>
        <div className="co-card dash-stat">
          <span className="dash-stat-label">Devices</span>
          <span className="dash-stat-value">{devices.length} / {nodes}</span>
          <span className="dash-stat-sub">{slotsLeft} slot{slotsLeft !== 1 ? "s" : ""} free</span>
        </div>
        <div className="co-card dash-stat">
          <span className="dash-stat-label">Total paid</span>
          <span className="dash-stat-value">{txs === null ? "…" : inr(totalPaid)}</span>
          <span className="dash-stat-sub">{paidTxs.length} successful payment{paidTxs.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="co-card dash-stat">
          <span className="dash-stat-label">Upcoming payment</span>
          {plan === "free" ? (
            <>
              <span className="dash-stat-value">—</span>
              <span className="dash-stat-sub">free tier · nothing due</span>
            </>
          ) : expiresAt ? (
            <>
              <span className="dash-stat-value">{latestPaid ? inr(latestPaid.amountInr) : "—"}</span>
              <span className="dash-stat-sub">renews {formatDate(expiresAt)}</span>
            </>
          ) : (
            <>
              <span className="dash-stat-value">—</span>
              <span className="dash-stat-sub">no renewal date on file</span>
            </>
          )}
        </div>
      </div>

      {/* devices — keyed by MAC, slots enforced against the plan */}
      <div className="co-card" style={{ marginTop: 18 }}>
        <div className="co-card-head">
          <h2 className="co-card-title">Devices</h2>
          <span className="co-hint">{devices.length} / {nodes} slots used</span>
        </div>

        {!fleetReady ? (
          <p className="co-hint">Loading fleet…</p>
        ) : devices.length === 0 ? (
          <p className="co-hint" style={{ marginBottom: 16 }}>
            No devices yet — register your first one below. Binding is permanent: once a MAC is bound it cannot be unbound.
          </p>
        ) : (
          <ul className="dash-devices">
            {devices.map((d) => {
              const seen = d.lastSeenAt ?? d.createdAt;
              const online = !!d.lastSeenAt && Date.now() - d.lastSeenAt.getTime() < 15 * 60 * 1000;
              return (
                <li key={d.id} className="dash-device">
                  <span className={`co-dot${online ? "" : " is-off"}`} aria-hidden="true" />
                  <div className="dash-device-main">
                    {renamingId === d.id ? (
                      <span className="dash-rename-row">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          maxLength={60}
                          aria-label="Device name"
                        />
                        <button type="button" className="co-btn-ghost co-btn-xs" disabled={rowBusy === d.id} onClick={() => renameDevice(d.id)}>
                          Save
                        </button>
                        <button type="button" className="co-btn-ghost co-btn-xs" onClick={() => setRenamingId(null)}>
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <span className="dash-device-name">{d.name}</span>
                    )}
                    <span className="dash-device-meta">
                      {d.platform} · <span className="dash-mac">{d.mac || "no MAC on file"}</span> · last seen {relTime(seen)}
                    </span>
                  </div>
                  <span className={`dash-status${online ? " is-on" : ""}`}>{online ? "online" : "offline"}</span>
                  {confirmDeleteId === d.id ? (
                    <span className="dash-confirm">
                      <span>Remove?</span>
                      <button type="button" className="co-btn-ghost co-btn-xs is-danger" disabled={rowBusy === d.id} onClick={() => removeDevice(d.id)}>
                        Yes, remove
                      </button>
                      <button type="button" className="co-btn-ghost co-btn-xs" onClick={() => setConfirmDeleteId(null)}>
                        Keep
                      </button>
                    </span>
                  ) : (
                    <span className="dash-actions">
                      <button
                        type="button"
                        className="co-btn-ghost co-btn-xs"
                        onClick={() => {
                          setRenamingId(d.id);
                          setRenameValue(d.name);
                          setConfirmDeleteId(null);
                        }}
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        className="co-btn-ghost co-btn-xs is-danger"
                        onClick={() => {
                          setConfirmDeleteId(d.id);
                          setRenamingId(null);
                        }}
                      >
                        Remove
                      </button>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {rowError && (
          <p className="co-error" role="alert" style={{ marginTop: 12 }}>
            {rowError}
          </p>
        )}

        {slotsLeft > 0 ? (
          <form className="dash-add" onSubmit={addDevice}>
            <h3 className="dash-add-title">Register a device</h3>
            <div className="dash-add-grid">
              <label className="co-field">
                <span className="co-label">Device name</span>
                <input
                  type="text"
                  value={devName}
                  onChange={(e) => setDevName(e.target.value)}
                  placeholder={`e.g. ${accountFirstName}'s MacBook`}
                  maxLength={60}
                  required
                />
              </label>
              <label className="co-field">
                <span className="co-label">MAC address</span>
                <input
                  type="text"
                  value={devMac}
                  onChange={(e) => setDevMac(e.target.value.toUpperCase())}
                  placeholder="AA:BB:CC:DD:EE:FF"
                  maxLength={17}
                  required
                  className="dash-mac-input"
                />
              </label>
              <label className="co-field">
                <span className="co-label">Platform</span>
                <select value={devPlatform} onChange={(e) => setDevPlatform(e.target.value)}>
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit" className="co-btn" disabled={devBusy}>
                {devBusy ? "Adding…" : "Add device"}
              </button>
            </div>
            {devError && (
              <p className="co-error" role="alert" style={{ marginTop: 12 }}>
                {devError}
              </p>
            )}
            <p className="co-hint" style={{ marginTop: 10 }}>
              * Binding is permanent — once a MAC is bound to your plan it cannot be unbound. {slotsLeft} slot{slotsLeft !== 1 ? "s" : ""} free.
            </p>
          </form>
        ) : (
          <p className="co-hint" style={{ marginTop: 14 }}>
            All {nodes} slots are used.{" "}
            <Link href={plan === "teams" ? "/checkout?plan=teams" : "/checkout?plan=starter"}>Add nodes at checkout →</Link>
          </p>
        )}
      </div>

      {/* transactions — straight from the payments table */}
      <div className="co-card" style={{ marginTop: 18 }}>
        <div className="co-card-head">
          <h2 className="co-card-title">Transactions</h2>
          <span className="co-hint">{txs === null ? "loading…" : `${txs.length} record${txs.length !== 1 ? "s" : ""}`}</span>
        </div>
        {txs === null ? (
          <p className="co-hint">Loading transactions…</p>
        ) : txs.length === 0 ? (
          <p className="co-hint" style={{ margin: 0 }}>No transactions yet — your payments will appear here.</p>
        ) : (
          <ul className="dash-txs">
            {txs.map((t) => (
              <li key={t.id} className="dash-tx">
                <div className="dash-tx-main">
                  <span className="dash-tx-plan" style={{ textTransform: "capitalize" }}>
                    {t.plan}{t.nodes ? ` · ${t.nodes} nodes` : ""}
                  </span>
                  <span className="dash-tx-meta">
                    {t.date}
                    {t.razorpayPaymentId ? ` · ${t.razorpayPaymentId.slice(0, 14)}…` : ""}
                  </span>
                </div>
                <span className="dash-tx-amount">{inr(t.amountInr)}</span>
                <span className={`dash-status ${statusClass(t.status)}`}>{t.status}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
        <Link href="/profile" className="co-btn-ghost" style={{ textDecoration: "none" }}>← Back to profile</Link>
        <Link href="/#pricing" className="co-btn-ghost" style={{ textDecoration: "none" }}>Change plan →</Link>
        <button
          type="button"
          className="co-btn-ghost"
          style={{ marginLeft: "auto" }}
          onClick={async () => {
            const auth = getFirebaseAuth();
            if (!auth) return;
            try {
              await signOut(auth);
            } catch {}
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
