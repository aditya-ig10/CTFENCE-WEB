"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  AdminUserRecord,
  AdminFleetNode,
  AdminPaymentRecord,
} from "@/lib/adminStore";
import { AdminAuditEntry, IpAttemptRecord, ADMIN_EMAIL } from "@/lib/adminConstants";

function formatDate(d: string | Date | number | null | undefined): string {
  if (!d) return "—";
  try {
    const date = typeof d === "string" || typeof d === "number" ? new Date(d) : d;
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatDateTime(d: string | Date | number | null | undefined): string {
  if (!d) return "—";
  try {
    const date = typeof d === "string" || typeof d === "number" ? new Date(d) : d;
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}


function getDaysRemaining(d: string | null | undefined): { label: string; isExpired: boolean; isNear: boolean } {
  if (!d) return { label: "Free forever", isExpired: false, isNear: false };
  const target = new Date(d).getTime();
  if (isNaN(target)) return { label: "—", isExpired: false, isNear: false };
  const diff = target - Date.now();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: `Expired (${Math.abs(days)}d ago)`, isExpired: true, isNear: false };
  if (days === 0) return { label: "Expires today", isExpired: false, isNear: true };
  if (days <= 7) return { label: `${days}d left`, isExpired: false, isNear: true };
  return { label: `${days}d left`, isExpired: false, isNear: false };
}

export default function AdminDashboard({ magicToken }: { magicToken: string }) {
  const router = useRouter();

  const [isValidating, setIsValidating] = useState(true);
  const [tokenCountdown, setTokenCountdown] = useState<number>(600);
  const [copied, setCopied] = useState(false);

  const [activeTab, setActiveTab] = useState<"users" | "nodes" | "payments" | "bans" | "audit">("users");

  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [nodes, setNodes] = useState<AdminFleetNode[]>([]);
  const [payments, setPayments] = useState<AdminPaymentRecord[]>([]);
  const [bans, setBans] = useState<IpAttemptRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditEntry[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Per-action in-flight registry — keys like "duration:<uid>", "plan:<uid>", "ban:<uid>", "profile:<uid>"
  const [pendingActions, setPendingActions] = useState<Record<string, boolean>>({});
  const setPending = (key: string, on: boolean) =>
    setPendingActions((prev) => ({ ...prev, [key]: on }));
  const isPending = (key: string) => !!pendingActions[key];
  const anyPending = Object.values(pendingActions).some(Boolean);



  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");

  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);

  // Draft selections — the backend is only hit when the admin explicitly
  // applies/saves, so clicking around never fires requests.
  const [planDraft, setPlanDraft] = useState<AdminUserRecord["plan"] | null>(null);
  const [nodeDraft, setNodeDraft] = useState<number | null>(null);
  const [profileDraft, setProfileDraft] = useState<{
    firstName: string;
    lastName: string;
    company: string;
    adminNotes: string;
  } | null>(null);
  const hasDraftChanges = planDraft !== null || nodeDraft !== null || profileDraft !== null;

  // Reset drafts whenever a different user is opened
  useEffect(() => {
    setPlanDraft(null);
    setNodeDraft(null);
    setProfileDraft(null);
  }, [selectedUser?.uid]);

  // Commit plan tier + node limit in ONE request when admin clicks Apply
  async function applyPlanChanges() {
    if (!selectedUser) return;
    const plan = planDraft ?? selectedUser.plan;
    const nodes = nodeDraft ?? selectedUser.nodes;
    const planChanged = planDraft !== null && planDraft !== selectedUser.plan;
    const nodesChanged = nodeDraft !== null && nodeDraft !== selectedUser.nodes;
    if (!planChanged && !nodesChanged) {
      setPlanDraft(null);
      setNodeDraft(null);
      return;
    }
    await handleChangePlanTier(selectedUser.uid, plan, selectedUser.status, nodes);
    setPlanDraft(null);
    setNodeDraft(null);
  }

  // Commit only the profile fields that actually changed, in ONE request
  async function applyProfileChanges() {
    if (!selectedUser || !profileDraft) return;
    const updates: Partial<AdminUserRecord> = {};
    const fields = ["firstName", "lastName", "company", "adminNotes"] as const;
    fields.forEach((f) => {
      const next = profileDraft[f] ?? "";
      const current = (selectedUser[f] as string | undefined) ?? "";
      if (next !== current) updates[f] = next;
    });
    if (Object.keys(updates).length === 0) {
      setProfileDraft(null);
      return;
    }
    await handleUpdateUserProfile(selectedUser.uid, updates);
    setProfileDraft(null);
  }

  // Close modal, warning if drafts are discarded
  function closeUserModal() {
    if (hasDraftChanges && selectedUser) {
      flash("Closed without applying — unsaved changes discarded", false);
    }
    setPlanDraft(null);
    setNodeDraft(null);
    setProfileDraft(null);
    setSelectedUser(null);
  }

  const [userModalTab, setUserModalTab] = useState<"plan" | "nodes" | "payments" | "profile">("plan");
  // Sub modals
  const [nodeModalOpen, setNodeModalOpen] = useState(false);
  const [nodeToEdit, setNodeToEdit] = useState<AdminFleetNode | null>(null);
  const [nodeForm, setNodeForm] = useState({
    name: "",
    region: "us-east-1",
    host: "127.0.0.1",
    port: 8443,
    policyMode: "strict" as AdminFleetNode["policyMode"],
    status: "online" as AdminFleetNode["status"],
  });

  const [newUserModalOpen, setNewUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    company: "",
    plan: "starter" as AdminUserRecord["plan"],
    nodes: 3,
    durationDays: 30,
  });

  const [banModalOpen, setBanModalOpen] = useState(false);
  const [banForm, setBanForm] = useState({ ip: "", durationMinutes: 30, reason: "Manual ban" });

  const flash = (text: string, ok = true) => {
    setStatusMsg({ text, ok });
    setTimeout(() => setStatusMsg(null), 3500);
  };

  // Validate temporary magic token
  useEffect(() => {
    async function validateToken() {
      setIsValidating(true);
      try {
        const res = await fetch("/api/admin/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: magicToken }),
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          setTokenCountdown(data.remainingSeconds || 600);
          setIsValidating(false);
        } else {
          router.push("/privacy");
        }
      } catch {
        router.push("/privacy");
      }
    }
    validateToken();
  }, [magicToken, router]);

  // 10-minute token countdown ticker
  useEffect(() => {
    if (tokenCountdown <= 0) return;
    const ticker = setInterval(() => {
      setTokenCountdown((prev) => {
        if (prev <= 1) {
          refreshMagicSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(ticker);
  }, [tokenCountdown]);

  async function refreshMagicSession() {
    try {
      const res = await fetch("/api/admin/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: magicToken }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setTokenCountdown(data.remainingSeconds);
        if (data.currentMagicToken && data.currentMagicToken !== magicToken) {
          router.replace(data.currentMagicPath);
        }
      }
    } catch {}
  }

  // Load Real Data from Firestore & API simultaneously
  const loadData = async () => {
    if (!magicToken) return;
    setLoadingData(true);
    setSyncing(true);

    const headers = {
      "x-admin-token": magicToken,
      "x-admin-email": ADMIN_EMAIL,
    };

    // 1. Fetch from server API routes
    try {
      const [uRes, nRes, pRes, bRes, aRes] = await Promise.all([
        fetch("/api/admin/users", { headers }),
        fetch("/api/admin/nodes", { headers }),
        fetch("/api/admin/payments", { headers }),
        fetch("/api/admin/bans", { headers }),
        fetch("/api/admin/audit", { headers }),
      ]);

      const [uData, nData, pData, bData, aData] = await Promise.all([
        uRes.json(),
        nRes.json(),
        pRes.json(),
        bRes.json(),
        aRes.json(),
      ]);

      if (uData.ok && Array.isArray(uData.users) && uData.users.length > 0) {
        setUsers(uData.users);
      }
      if (nData.ok && Array.isArray(nData.nodes)) setNodes(nData.nodes);
      if (pData.ok && Array.isArray(pData.payments)) setPayments(pData.payments);
      if (bData.ok && Array.isArray(bData.bans)) setBans(bData.bans);
      if (aData.ok && Array.isArray(aData.logs)) setAuditLogs(aData.logs);
    } catch (err) {
      console.warn("API data load warning:", err);
    }

    setLoadingData(false);
    setSyncing(false);
  };

  useEffect(() => {
    if (!isValidating) {
      loadData();
    }
  }, [isValidating]);

  useEffect(() => {
    if (selectedUser) {
      const updated = users.find((u) => u.uid === selectedUser.uid);
      if (updated) setSelectedUser(updated);
    }
  }, [users]);

  const copyMagicUrl = () => {
    const fullUrl = `${window.location.origin}/admin/${magicToken}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    flash("Magic link copied to clipboard");
  };

  // Modify user plan duration — optimistic UI, server sync in background
  async function handleModifyPlanDuration(uid: string, daysDelta: number | null, customDate?: string) {
    const key = `duration:${uid}`;
    if (isPending(key)) return;

    const user = users.find((u) => u.uid === uid);
    let newExpiry: Date;
    if (customDate) {
      newExpiry = new Date(customDate);
    } else if (typeof daysDelta === "number") {
      const base = user?.expiresAt ? new Date(user.expiresAt) : new Date();
      const startingTime = daysDelta > 0 && base.getTime() < Date.now() ? Date.now() : base.getTime();
      newExpiry = new Date(startingTime + daysDelta * 864e5);
    } else {
      newExpiry = new Date(Date.now() + 30 * 864e5);
    }

    const expiryIso = newExpiry.toISOString();
    const newStatus = newExpiry.getTime() > Date.now() ? "active" : "past_due";

    // Optimistic: reflect the change instantly
    const previous = user;
    setUsers((list) =>
      list.map((u) =>
        u.uid === uid
          ? { ...u, expiresAt: expiryIso, status: u.isBanned ? "banned" : newStatus }
          : u
      )
    );
    setPending(key, true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": magicToken,
          "x-admin-email": ADMIN_EMAIL,
        },
        body: JSON.stringify({ action: "modify_duration", uid, daysDelta, customExpiryDate: customDate }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        flash("Duration updated");
      } else {
        throw new Error(data.error || "Update rejected");
      }
    } catch {
      // Revert on failure
      if (previous) setUsers((list) => list.map((u) => (u.uid === uid ? previous : u)));
      flash("Failed to update duration — change reverted", false);
    } finally {
      setPending(key, false);
      loadData(); // quiet background re-sync, never blocks the UI
    }
  }

  // Change user plan tier — optimistic UI, server sync in background
  async function handleChangePlanTier(uid: string, plan: AdminUserRecord["plan"], status: AdminUserRecord["status"], nodesCount?: number) {
    const key = `plan:${uid}`;
    if (isPending(key)) return;

    const previous = users.find((u) => u.uid === uid);
    setUsers((list) =>
      list.map((u) =>
        u.uid === uid
          ? {
              ...u,
              plan,
              status: u.isBanned ? "banned" : status,
              nodes: nodesCount || u.nodes,
              nodeLimit: nodesCount || u.nodeLimit,
            }
          : u
      )
    );
    setPending(key, true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": magicToken,
          "x-admin-email": ADMIN_EMAIL,
        },
        body: JSON.stringify({ action: "change_plan", uid, plan, status, nodes: nodesCount }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        flash(`Plan changed to ${plan}`);
      } else {
        throw new Error(data.error || "Update rejected");
      }
    } catch {
      if (previous) setUsers((list) => list.map((u) => (u.uid === uid ? previous : u)));
      flash("Failed to change plan — change reverted", false);
    } finally {
      setPending(key, false);
      loadData();
    }
  }

  // Toggle user ban — optimistic UI, server sync in background
  async function handleToggleBanUser(uid: string, isBanned: boolean) {
    const key = `ban:${uid}`;
    if (isPending(key)) return;

    const previous = users.find((u) => u.uid === uid);
    setUsers((list) =>
      list.map((u) => (u.uid === uid ? { ...u, isBanned, status: isBanned ? "banned" : "active" } : u))
    );
    setPending(key, true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": magicToken,
          "x-admin-email": ADMIN_EMAIL,
        },
        body: JSON.stringify({ action: "toggle_ban", uid, isBanned }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        flash(isBanned ? "User account suspended" : "User account activated");
      } else {
        throw new Error(data.error || "Update rejected");
      }
    } catch {
      if (previous) setUsers((list) => list.map((u) => (u.uid === uid ? previous : u)));
      flash("Failed to update ban status — change reverted", false);
    } finally {
      setPending(key, false);
      loadData();
    }
  }

  // Update user profile fields — optimistic UI, server sync in background
  async function handleUpdateUserProfile(uid: string, updates: Partial<AdminUserRecord>) {
    const key = `profile:${uid}`;
    if (isPending(key)) return;

    const previous = users.find((u) => u.uid === uid);
    setUsers((list) => list.map((u) => (u.uid === uid ? { ...u, ...updates } : u)));
    setPending(key, true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": magicToken,
          "x-admin-email": ADMIN_EMAIL,
        },
        body: JSON.stringify({ action: "update_user", uid, updates }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        flash("Saved profile changes");
      } else {
        throw new Error(data.error || "Update rejected");
      }
    } catch {
      if (previous) setUsers((list) => list.map((u) => (u.uid === uid ? previous : u)));
      flash("Failed to save profile — change reverted", false);
    } finally {
      setPending(key, false);
      loadData();
    }
  }

  // Create new user account — optimistic add, server sync in background
  async function handleCreateNewUser(e: React.FormEvent) {
    e.preventDefault();
    if (!newUserForm.email || isPending("create-user")) return;
    setPending("create-user", true);

    const newUid = `user_${Date.now()}`;
    const expDate = new Date(Date.now() + newUserForm.durationDays * 864e5).toISOString();

    const optimisticUser: AdminUserRecord = {
      id: newUid,
      uid: newUid,
      email: newUserForm.email,
      firstName: newUserForm.firstName,
      lastName: newUserForm.lastName,
      company: newUserForm.company,
      plan: newUserForm.plan,
      status: "active",
      nodes: newUserForm.nodes,
      nodeLimit: newUserForm.nodes,
      expiresAt: expDate,
      createdAt: new Date().toISOString(),
      isBanned: false,
      adminNotes: "",
      tags: [],
      assignedNodes: [],
      transactionsCount: 0,
      totalSpendInr: 0,
    };

    // Optimistic: show the new account instantly
    setUsers((list) => [optimisticUser, ...list]);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": magicToken,
          "x-admin-email": ADMIN_EMAIL,
        },
        body: JSON.stringify({ action: "update_user", uid: newUid, updates: optimisticUser }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Create rejected");
      flash(`Account created for ${newUserForm.email}`);
    } catch {
      setUsers((list) => list.filter((u) => u.uid !== newUid));
      flash("Failed to create account", false);
    } finally {
      setPending("create-user", false);
      setNewUserModalOpen(false);
      setNewUserForm({ email: "", firstName: "", lastName: "", company: "", plan: "starter", nodes: 3, durationDays: 30 });
      loadData();
    }
  }

  // Node actions
  async function handleSaveNode(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser && !nodeToEdit) return;
    if (isPending("save-node")) return;
    setPending("save-node", true);

    try {
      if (nodeToEdit) {
        // Optimistic update
        const previousNodes = nodes;
        setNodes((list) => list.map((n) => (n.id === nodeToEdit.id ? { ...n, ...nodeForm } : n)));
        try {
          const res = await fetch("/api/admin/nodes", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "x-admin-token": magicToken,
              "x-admin-email": ADMIN_EMAIL,
            },
            body: JSON.stringify({ id: nodeToEdit.id, updates: nodeForm }),
          });
          if (!res.ok) throw new Error("rejected");
          flash("Node updated");
        } catch {
          setNodes(previousNodes);
          flash("Failed to update node", false);
        }
        setNodeModalOpen(false);
      } else if (selectedUser) {
        const res = await fetch("/api/admin/nodes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-token": magicToken,
            "x-admin-email": ADMIN_EMAIL,
          },
          body: JSON.stringify({ userId: selectedUser.uid, ...nodeForm }),
        });
        if (res.ok) {
          flash("Node provisioned");
          setNodeModalOpen(false);
        } else {
          flash("Failed to provision node", false);
        }
      }
    } catch {
      flash("Error saving node", false);
    } finally {
      setPending("save-node", false);
      loadData();
    }
  }

  async function handleDeleteNode(nodeId: string) {
    if (!confirm("Delete this enforcement node?")) return;
    if (isPending(`delete-node:${nodeId}`)) return;
    setPending(`delete-node:${nodeId}`, true);

    // Optimistic removal
    const previousNodes = nodes;
    setNodes((list) => list.filter((n) => n.id !== nodeId));

    try {
      const res = await fetch(`/api/admin/nodes?id=${nodeId}`, {
        method: "DELETE",
        headers: {
          "x-admin-token": magicToken,
          "x-admin-email": ADMIN_EMAIL,
        },
      });
      if (res.ok) {
        flash("Node removed");
      } else {
        throw new Error("rejected");
      }
    } catch {
      setNodes(previousNodes);
      flash("Failed to delete node", false);
    } finally {
      setPending(`delete-node:${nodeId}`, false);
      loadData();
    }
  }

  // Ban actions
  async function handleUnbanIp(ip: string) {
    if (isPending(`unban:${ip}`)) return;
    setPending(`unban:${ip}`, true);

    // Optimistic removal
    const previousBans = bans;
    setBans((list) => list.filter((b) => b.ip !== ip));

    try {
      const res = await fetch(`/api/admin/bans?ip=${encodeURIComponent(ip)}`, {
        method: "DELETE",
        headers: {
          "x-admin-token": magicToken,
          "x-admin-email": ADMIN_EMAIL,
        },
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        flash(`IP ${ip} unbanned`);
      } else {
        throw new Error("rejected");
      }
    } catch {
      setBans(previousBans);
      flash("Failed to unban IP", false);
    } finally {
      setPending(`unban:${ip}`, false);
      loadData();
    }
  }

  async function handleManualBan(e: React.FormEvent) {
    e.preventDefault();
    if (!banForm.ip || isPending("manual-ban")) return;
    setPending("manual-ban", true);
    try {
      const res = await fetch("/api/admin/bans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": magicToken,
          "x-admin-email": ADMIN_EMAIL,
        },
        body: JSON.stringify(banForm),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        flash(`IP ${banForm.ip} locked out for ${banForm.durationMinutes}m`);
        setBanModalOpen(false);
        setBanForm({ ip: "", durationMinutes: 30, reason: "Manual ban" });
      } else {
        flash(data.error || "Failed to ban IP", false);
      }
    } catch {
      flash("Failed to ban IP", false);
    } finally {
      setPending("manual-ban", false);
      loadData();
    }
  }

  // PDF invoice downloader
  async function downloadInvoicePdf(p: AdminPaymentRecord, user: AdminUserRecord | null) {
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const createdAt = p.createdAt ? new Date(p.createdAt) : new Date();

      doc.setFillColor(255, 49, 68);
      doc.rect(0, 0, 210, 22, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Context Fence", 14, 13);
      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.text("Context Fence  •  Synthrun  •  contextfence.dev", 14, 18);
      doc.setTextColor(0, 0, 0);

      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("INVOICE", 14, 32);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Invoice #: ${p.id.slice(0, 12).toUpperCase()}`, 14, 38);
      doc.text(`Date: ${formatDate(createdAt)}`, 14, 43);
      doc.text(`Status: ${p.status.toUpperCase()}`, 14, 48);

      doc.setFont("helvetica", "bold");
      doc.text("From:", 14, 58);
      doc.setFont("helvetica", "normal");
      doc.text("Context Fence (Synthrun)", 14, 63);
      doc.text("New Delhi, India", 14, 68);
      doc.text("hello@synthrun.site", 14, 73);

      doc.setFont("helvetica", "bold");
      doc.text("Bill to:", 110, 58);
      doc.setFont("helvetica", "normal");
      doc.text(`${user?.firstName || "Customer"} ${user?.lastName || ""}`.trim(), 110, 63);
      doc.text(p.email || user?.email || "", 110, 68);
      if (user?.company) doc.text(user.company, 110, 73);

      doc.setDrawColor(200);
      doc.line(14, 85, 196, 85);

      let y = 94;
      doc.setFont("helvetica", "bold");
      doc.text("Item", 14, y);
      doc.text("Nodes", 110, y);
      doc.text("Amount", 160, y);
      y += 6;
      doc.setDrawColor(230);
      doc.line(14, y - 4, 196, y - 4);

      doc.setFont("helvetica", "normal");
      doc.text(`Context Fence ${p.plan.toUpperCase()} Plan`, 14, y);
      doc.text(String(p.nodes), 110, y);
      doc.text(`Rs. ${Number(p.amountInr).toLocaleString("en-IN")}`, 160, y);

      y += 12;
      doc.setDrawColor(0);
      doc.line(14, y - 4, 196, y - 4);
      doc.setFont("helvetica", "bold");
      doc.text("Total Paid", 14, y);
      doc.text(`Rs. ${Number(p.amountInr).toLocaleString("en-IN")}`, 160, y);

      doc.save(`ContextFence-Invoice-${p.id.slice(0, 8)}.pdf`);
      flash("Invoice PDF downloaded");
    } catch {
      flash("Failed to generate PDF", false);
    }
  }

  // Computed metrics
  const metrics = useMemo(() => {
    const totalUsers = users.length;
    const paidUsers = users.filter((u) => u.plan !== "free" && u.status === "active").length;
    const totalNodes = users.reduce((acc, u) => acc + (u.nodes || 1), 0);
    const totalRevenue = payments.reduce((acc, p) => acc + (p.status === "paid" ? p.amountInr : 0), 0);
    return { totalUsers, paidUsers, totalNodes, totalRevenue };
  }, [users, payments]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        u.email.toLowerCase().includes(q) ||
        (u.firstName && u.firstName.toLowerCase().includes(q)) ||
        (u.lastName && u.lastName.toLowerCase().includes(q)) ||
        (u.company && u.company.toLowerCase().includes(q));

      const matchesPlan = planFilter === "all" || u.plan === planFilter;
      return matchesSearch && matchesPlan;
    });
  }, [users, searchQuery, planFilter]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (isValidating) {
    return (
      <div className="chk-page" style={{ textAlign: "center", paddingTop: 100 }}>
        <p className="chk-hint">verifying admin session…</p>
      </div>
    );
  }

  return (
    <div className="chk-page" style={{ maxWidth: 1080 }}>
      {/* Flash toast */}
      {statusMsg && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            left: 24,
            zIndex: 9999,
            maxWidth: "calc(100vw - 48px)",
            marginLeft: "auto",
            width: "fit-content",
            background: "var(--surface)",
            border: `1px solid ${statusMsg.ok ? "var(--ok, #28c840)" : "var(--accent)"}`,
            borderRadius: 999,
            padding: "10px 20px",
            fontFamily: "var(--font-canela)",
            fontSize: 14,
            color: "var(--bright)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          }}
        >
          {statusMsg.ok ? "✓ " : "⚠️ "} {statusMsg.text}
        </div>
      )}

      {/* Header bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
        <div>
          <div className="chk-eyebrow">{"// admin"}</div>
          <h1 className="chk-title" style={{ fontSize: 34, margin: "0 0 6px" }}>
            Admin Console
          </h1>
          <p className="chk-sub" style={{ margin: 0, fontSize: 14 }}>
            Signed in as <strong>{ADMIN_EMAIL}</strong> · Live Firestore synchronization enabled.
          </p>
        </div>

        {/* 10-min Temporary Magic Link Pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 999,
            padding: "6px 16px",
            fontSize: 12,
            fontFamily: "var(--font-jetbrains), monospace",
          }}
        >
          <span style={{ color: "var(--muted)" }}>10m link</span>
          <span style={{ color: "var(--accent)", fontWeight: 700 }}>{formatCountdown(tokenCountdown)}</span>
          <button
            type="button"
            className="chk-apply"
            onClick={copyMagicUrl}
            style={{ padding: "3px 10px", fontSize: 10 }}
          >
            {copied ? "copied ✓" : "copy link"}
          </button>
          <button
            type="button"
            onClick={refreshMagicSession}
            style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 11, padding: "0 2px" }}
            title="Refresh session link"
          >
            ↻
          </button>
        </div>
      </div>

      {/* KPI Cards Row — Minimal Landing Page Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div className="chk-card" style={{ padding: "20px 24px" }}>
          <div className="chk-label" style={{ marginBottom: 6 }}>Users</div>
          <div style={{ fontFamily: "var(--font-canela)", fontSize: 28, fontWeight: 700, color: "var(--bright)", lineHeight: 1 }}>
            {metrics.totalUsers}
          </div>
          <div className="chk-hint" style={{ marginTop: 4 }}>
            {metrics.paidUsers} active subscriptions
          </div>
        </div>

        <div className="chk-card" style={{ padding: "20px 24px" }}>
          <div className="chk-label" style={{ marginBottom: 6 }}>Nodes Deployed</div>
          <div style={{ fontFamily: "var(--font-canela)", fontSize: 28, fontWeight: 700, color: "var(--bright)", lineHeight: 1 }}>
            {metrics.totalNodes}
          </div>
          <div className="chk-hint" style={{ marginTop: 4 }}>
            {nodes.length} cluster nodes active
          </div>
        </div>

        <div className="chk-card" style={{ padding: "20px 24px" }}>
          <div className="chk-label" style={{ marginBottom: 6 }}>Revenue</div>
          <div style={{ fontFamily: "var(--font-canela)", fontSize: 28, fontWeight: 700, color: "var(--bright)", lineHeight: 1 }}>
            ₹{metrics.totalRevenue.toLocaleString("en-IN")}
          </div>
          <div className="chk-hint" style={{ marginTop: 4 }}>
            {payments.length} transactions total
          </div>
        </div>

        <div className="chk-card" style={{ padding: "20px 24px" }}>
          <div className="chk-label" style={{ marginBottom: 6 }}>Security</div>
          <div style={{ fontFamily: "var(--font-canela)", fontSize: 28, fontWeight: 700, color: "var(--bright)", lineHeight: 1 }}>
            {bans.length}
          </div>
          <div className="chk-hint" style={{ marginTop: 4 }}>
            {bans.filter((b) => b.bannedUntil && b.bannedUntil > Date.now()).length} active IP blocks
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { id: "users", label: `Users (${users.length})` },
            { id: "nodes", label: `Nodes (${nodes.length})` },
            { id: "payments", label: `Billing (${payments.length})` },
            { id: "bans", label: `IP Bans (${bans.length})` },
            { id: "audit", label: `Audit Log` },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as typeof activeTab)}
              style={{
                background: "none",
                border: "none",
                borderBottom: activeTab === t.id ? "2px solid var(--accent)" : "2px solid transparent",
                color: activeTab === t.id ? "var(--bright)" : "var(--muted)",
                fontFamily: "var(--font-canela)",
                fontSize: 15,
                fontWeight: activeTab === t.id ? 700 : 400,
                padding: "8px 14px",
                cursor: "pointer",
                transition: "color 150ms",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {anyPending && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: "var(--accent)",
                border: "1px solid var(--accent)",
                borderRadius: 999,
                padding: "4px 12px",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  border: "2px solid var(--accent)",
                  borderTopColor: "transparent",
                  display: "inline-block",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              Saving…
            </span>
          )}
          {syncing && !anyPending && (
            <span style={{ fontSize: 12, color: "var(--muted)" }}>Syncing…</span>
          )}
          <button
            type="button"
            className="chk-apply"
            onClick={loadData}
            disabled={loadingData}
            style={{ padding: "8px 16px" }}
          >
            {loadingData ? "syncing…" : "sync"}
          </button>
          {activeTab === "users" && (
            <button
              type="button"
              className="chk-pay"
              onClick={() => setNewUserModalOpen(true)}
              style={{ width: "auto", padding: "8px 18px", marginTop: 0, fontSize: 13 }}
            >
              + New User
            </button>
          )}
          {activeTab === "bans" && (
            <button
              type="button"
              className="chk-pay"
              onClick={() => setBanModalOpen(true)}
              style={{ width: "auto", padding: "8px 18px", marginTop: 0, fontSize: 13 }}
            >
              + Ban IP
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. USERS DIRECTORY */}
      {/* ========================================================================= */}
      {activeTab === "users" && (
        <div className="chk-card">
          {/* Search bar & filter */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users by name, email, company…"
              style={{
                flex: "1 1 240px",
                background: "var(--void)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "8px 14px",
                color: "var(--text)",
                fontFamily: "var(--font-canela)",
                fontSize: 14,
                outline: "none",
              }}
            />
            <div style={{ display: "flex", gap: 6 }}>
              {["all", "enterprise", "teams", "starter", "free"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlanFilter(p)}
                  className="chk-apply"
                  style={{
                    padding: "6px 12px",
                    borderColor: planFilter === p ? "var(--accent)" : "var(--border)",
                    color: planFilter === p ? "var(--accent)" : "var(--muted)",
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <div style={{ overflowX: "auto" }}>
            <table className="tx-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Plan</th>
                  <th>Nodes</th>
                  <th>Duration</th>
                  <th>Spend</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length ? (
                  filteredUsers.map((u) => {
                    const daysMeta = getDaysRemaining(u.expiresAt);
                    return (
                      <tr key={u.uid}>
                        <td>
                          <div style={{ fontWeight: 600, color: "var(--bright)" }}>
                            {u.firstName || u.lastName ? `${u.firstName || ""} ${u.lastName || ""}`.trim() : "Account"}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--muted)" }}>
                            {u.email} {u.company ? `· ${u.company}` : ""}
                          </div>
                        </td>
                        <td>
                          <span className="plan-chip" data-plan={u.plan}>
                            {u.plan}
                          </span>
                        </td>
                        <td>{u.nodes || 1} nodes</td>
                        <td>
                          <div style={{ color: daysMeta.isExpired ? "var(--accent)" : "var(--bright)", fontWeight: 500 }}>
                            {daysMeta.label}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--muted)" }}>
                            {formatDate(u.expiresAt)}
                          </div>
                        </td>
                        <td>₹{(u.totalSpendInr || 0).toLocaleString("en-IN")}</td>
                        <td>
                          <span className={`tx-badge ${u.isBanned ? "" : u.status === "active" ? "tx-badge--paid" : "tx-badge--pending"}`} style={u.isBanned ? { color: "var(--accent)", borderColor: "var(--accent)" } : {}}>
                            {u.isBanned ? "banned" : u.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: 6 }}>
                            <button
                              type="button"
                              className="chk-apply"
                              onClick={() => {
                                setSelectedUser(u);
                                setUserModalTab("plan");
                              }}
                              style={{ padding: "6px 14px", color: "var(--bright)" }}
                            >
                              Manage
                            </button>
                            <button
                              type="button"
                              className="chk-apply"
                              onClick={() => handleModifyPlanDuration(u.uid, 30)}
                              disabled={isPending(`duration:${u.uid}`) || isPending(`plan:${u.uid}`)}
                              style={{ padding: "6px 10px", opacity: isPending(`duration:${u.uid}`) ? 0.6 : 1 }}
                              title="Add 30 days duration"
                            >
                              {isPending(`duration:${u.uid}`) ? "…" : "+30d"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="tx-empty">
                      {loadingData ? "Fetching records from Firestore…" : "No user accounts in Firestore."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. FLEET NODES */}
      {/* ========================================================================= */}
      {activeTab === "nodes" && (
        <div className="chk-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 className="chk-card-title" style={{ margin: 0 }}>Cluster Enforcement Nodes</h2>
            <span className="chk-hint">{nodes.length} nodes registered in Firestore</span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="tx-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Node</th>
                  <th>Assigned To</th>
                  <th>Region & Host</th>
                  <th>Policy</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {nodes.length ? (
                  nodes.map((n) => {
                    const owner = users.find((u) => u.uid === n.userId || u.id === n.userId);
                    return (
                      <tr key={n.id}>
                        <td>
                          <div style={{ fontWeight: 600, color: "var(--bright)" }}>{n.name}</div>
                          <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-jetbrains), monospace" }}>{n.nodeId}</div>
                        </td>
                        <td>{owner?.email || n.userId}</td>
                        <td>{n.region} · {n.host}:{n.port}</td>
                        <td>
                          <span style={{ textTransform: "uppercase", fontSize: 11 }}>{n.policyMode}</span>
                        </td>
                        <td>
                          <span className={`tx-badge ${n.status === "online" ? "tx-badge--paid" : ""}`}>
                            {n.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="chk-apply"
                            onClick={() => {
                              setNodeToEdit(n);
                              setNodeForm({
                                name: n.name,
                                region: n.region,
                                host: n.host,
                                port: n.port,
                                policyMode: n.policyMode,
                                status: n.status,
                              });
                              setNodeModalOpen(true);
                            }}
                            style={{ padding: "4px 10px", marginRight: 6 }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="chk-apply"
                            onClick={() => handleDeleteNode(n.id)}
                            style={{ padding: "4px 10px", borderColor: "var(--accent)", color: "var(--accent)" }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="tx-empty">
                      {loadingData ? "Fetching nodes from Firestore…" : "No fleet nodes in Firestore."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. BILLING & INVOICES */}
      {/* ========================================================================= */}
      {activeTab === "payments" && (
        <div className="chk-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 className="chk-card-title" style={{ margin: 0 }}>Transactions & Invoices</h2>
            <span className="chk-hint">Total: ₹{metrics.totalRevenue.toLocaleString("en-IN")}</span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="tx-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Plan & Nodes</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Bill</th>
                </tr>
              </thead>
              <tbody>
                {payments.length ? (
                  payments.map((p) => {
                    const user = users.find((u) => u.uid === p.userId || u.id === p.userId) || null;
                    return (
                      <tr key={p.id}>
                        <td>{formatDate(p.createdAt)}</td>
                        <td>{p.email}</td>
                        <td>
                          <span style={{ textTransform: "capitalize" }}>{p.plan}</span> · {p.nodes} nodes
                        </td>
                        <td>₹{p.amountInr.toLocaleString("en-IN")}</td>
                        <td>
                          <span className={`tx-badge ${p.status === "paid" ? "tx-badge--paid" : ""}`}>
                            {p.status}
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="chk-apply"
                            onClick={() => downloadInvoicePdf(p, user)}
                            style={{ padding: "6px 14px" }}
                          >
                            Download
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="tx-empty">
                      {loadingData ? "Fetching transactions from Firestore…" : "No payment records in Firestore."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. SECURITY & BANS */}
      {/* ========================================================================= */}
      {activeTab === "bans" && (
        <div className="chk-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h2 className="chk-card-title" style={{ margin: 0 }}>IP Lockouts & Bans</h2>
            <span className="chk-hint">{bans.length} entries</span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="tx-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>IP Address</th>
                  <th>Attempts</th>
                  <th>Lockout Status</th>
                  <th>Reason</th>
                  <th>Last Seen</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {bans.length ? (
                  bans.map((b) => {
                    const isBanned = b.bannedUntil && b.bannedUntil > Date.now();
                    const secs = isBanned ? Math.ceil((b.bannedUntil! - Date.now()) / 1000) : 0;
                    return (
                      <tr key={b.ip}>
                        <td style={{ fontFamily: "var(--font-jetbrains), monospace" }}>{b.ip}</td>
                        <td>{b.attempts} / 3</td>
                        <td>
                          {isBanned ? (
                            <span style={{ color: "var(--accent)", fontWeight: 600 }}>
                              Locked ({formatCountdown(secs)})
                            </span>
                          ) : (
                            <span style={{ color: "var(--muted)" }}>Cleared</span>
                          )}
                        </td>
                        <td>{b.reason || "3 Failed password attempts"}</td>
                        <td>{formatDateTime(b.lastAttemptAt)}</td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="chk-apply"
                            onClick={() => handleUnbanIp(b.ip)}
                            disabled={isPending(`unban:${b.ip}`)}
                            style={{ padding: "4px 12px", opacity: isPending(`unban:${b.ip}`) ? 0.6 : 1 }}
                          >
                            {isPending(`unban:${b.ip}`) ? "…" : "Unban"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="tx-empty">No banned IPs.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. AUDIT LOG */}
      {/* ========================================================================= */}
      {activeTab === "audit" && (
        <div className="chk-card">
          <h2 className="chk-card-title">Activity Log</h2>
          <div style={{ overflowX: "auto" }}>
            <table className="tx-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length ? (
                  auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: 12, color: "var(--muted)" }}>{formatDateTime(log.timestamp)}</td>
                      <td style={{ fontWeight: 600 }}>{log.action}</td>
                      <td>{log.targetUserId || "—"}</td>
                      <td style={{ color: "var(--muted)" }}>{log.details}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="tx-empty">No audit activity logged.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* USER MANAGEMENT DRAWER / MODAL */}
      {/* ========================================================================= */}
      {selectedUser && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(5, 5, 7, 0.75)",
            backdropFilter: "blur(6px)",
            padding: 20,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !anyPending) closeUserModal();
          }}
        >
          <div
            className="chk-card"
            style={{
              width: "100%",
              maxWidth: 720,
              maxHeight: "90vh",
              overflowY: "auto",
              padding: 32,
              position: "relative",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, borderBottom: "1px solid var(--border)", paddingBottom: 16 }}>
              <div>
                <div className="chk-eyebrow">{"// user details"}</div>
                <h2 className="chk-title" style={{ fontSize: 24, margin: "0 0 4px" }}>
                  {selectedUser.firstName || selectedUser.lastName ? `${selectedUser.firstName || ""} ${selectedUser.lastName || ""}`.trim() : "Account"}
                </h2>
                <div className="chk-hint">
                  {selectedUser.email} · UID: {selectedUser.uid}
                </div>
              </div>
              <button
                type="button"
                onClick={closeUserModal}
                style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 20, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {/* Tab switch */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
              {[
                { id: "plan", label: "Plan & Duration" },
                { id: "nodes", label: "Nodes" },
                { id: "payments", label: "Purchases" },
                { id: "profile", label: "Account info" },
              ].map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setUserModalTab(sub.id as typeof userModalTab)}
                  className="chk-apply"
                  style={{
                    padding: "6px 14px",
                    borderColor: userModalTab === sub.id ? "var(--accent)" : "var(--border)",
                    color: userModalTab === sub.id ? "var(--accent)" : "var(--muted)",
                  }}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {/* TAB: PLAN & DURATION */}
            {userModalTab === "plan" && (
              <div>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div className="chk-label">Change Plan Tier</div>
                    {planDraft !== null && planDraft !== selectedUser.plan && (
                      <span style={{ fontSize: 11, color: "var(--accent)" }}>Unapplied selection</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {(["free", "starter", "teams", "enterprise"] as AdminUserRecord["plan"][]).map((p) => {
                      const effectivePlan = planDraft ?? selectedUser.plan;
                      return (
                        <button
                          key={p}
                          type="button"
                          className="chk-apply"
                          onClick={() => setPlanDraft(p)}
                          style={{
                            padding: "10px 18px",
                            borderColor: effectivePlan === p ? "var(--accent)" : "var(--border)",
                            color: effectivePlan === p ? "var(--bright)" : "var(--muted)",
                            background: effectivePlan === p ? "var(--void)" : "transparent",
                            fontWeight: 700,
                          }}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ marginBottom: 20, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                  <div className="chk-label" style={{ marginBottom: 4 }}>Expiry Date</div>
                  <p className="chk-hint" style={{ margin: "0 0 12px", fontSize: 14 }}>
                    Current: <strong>{formatDate(selectedUser.expiresAt)}</strong> ({getDaysRemaining(selectedUser.expiresAt).label})
                  </p>

                  <div className="chk-label" style={{ marginBottom: 8 }}>Adjust Duration</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
                    {[
                      { l: "+7 days", d: 7 },
                      { l: "+30 days", d: 30 },
                      { l: "+90 days", d: 90 },
                      { l: "+1 year", d: 365 },
                      { l: "-7 days", d: -7 },
                      { l: "-30 days", d: -30 },
                    ].map((item) => (
                      <button
                        key={item.l}
                        type="button"
                        className="chk-apply"
                        onClick={() => handleModifyPlanDuration(selectedUser.uid, item.d)}
                        disabled={isPending(`duration:${selectedUser.uid}`)}
                        style={{ padding: "8px 14px", opacity: isPending(`duration:${selectedUser.uid}`) ? 0.6 : 1 }}
                      >
                        {item.l}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="chk-apply"
                      onClick={() => handleModifyPlanDuration(selectedUser.uid, null, new Date(Date.now() - 864e5).toISOString())}
                      disabled={isPending(`duration:${selectedUser.uid}`)}
                      style={{ padding: "8px 14px", borderColor: "var(--accent)", color: "var(--accent)", opacity: isPending(`duration:${selectedUser.uid}`) ? 0.6 : 1 }}
                    >
                      {isPending(`duration:${selectedUser.uid}`) ? "Saving…" : "Expire now"}
                    </button>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="chk-label">Or pick date:</span>
                    <input
                      type="date"
                      onChange={(e) => {
                        if (e.target.value) {
                          handleModifyPlanDuration(selectedUser.uid, null, new Date(e.target.value).toISOString());
                        }
                      }}
                      style={{
                        background: "var(--void)",
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        padding: "6px 10px",
                        color: "var(--text)",
                      }}
                    />
                  </div>
                </div>

                <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div className="chk-label">Node Limit</div>
                      <p className="chk-hint">{nodeDraft ?? selectedUser.nodes ?? 1} enforcement nodes allocated{nodeDraft !== null && nodeDraft !== selectedUser.nodes ? " (unapplied)" : ""}</p>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        className="chk-apply"
                        onClick={() => setNodeDraft(Math.max(1, (nodeDraft ?? selectedUser.nodes ?? 1) - 1))}
                        style={{ padding: "6px 14px", fontSize: 14 }}
                      >
                        -
                      </button>
                      <button
                        type="button"
                        className="chk-apply"
                        onClick={() => setNodeDraft((nodeDraft ?? selectedUser.nodes ?? 1) + 1)}
                        style={{ padding: "6px 14px", fontSize: 14 }}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Single Apply button — one backend request for plan + nodes together */}
                  {(planDraft !== null || nodeDraft !== null) && (
                    <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10, marginTop: 14 }}>
                      <button
                        type="button"
                        className="chk-apply"
                        onClick={() => {
                          setPlanDraft(null);
                          setNodeDraft(null);
                        }}
                        disabled={isPending(`plan:${selectedUser.uid}`)}
                        style={{ padding: "8px 16px" }}
                      >
                        Discard
                      </button>
                      <button
                        type="button"
                        className="chk-pay"
                        onClick={applyPlanChanges}
                        disabled={isPending(`plan:${selectedUser.uid}`)}
                        style={{ width: "auto", padding: "8px 20px", marginTop: 0, opacity: isPending(`plan:${selectedUser.uid}`) ? 0.7 : 1 }}
                      >
                        {isPending(`plan:${selectedUser.uid}`) ? "Applying…" : "Apply Changes"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: NODES */}
            {userModalTab === "nodes" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span className="chk-hint">Nodes for this account</span>
                  <button
                    type="button"
                    className="chk-apply"
                    onClick={() => {
                      setNodeToEdit(null);
                      setNodeForm({
                        name: `Node ${(selectedUser.assignedNodes?.length || 0) + 1}`,
                        region: "us-east-1",
                        host: "127.0.0.1",
                        port: 8443,
                        policyMode: "strict",
                        status: "online",
                      });
                      setNodeModalOpen(true);
                    }}
                    style={{ padding: "6px 14px" }}
                  >
                    + Add node
                  </button>
                </div>

                {selectedUser.assignedNodes?.length ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {selectedUser.assignedNodes.map((n) => (
                      <div
                        key={n.id}
                        style={{
                          background: "var(--void)",
                          border: "1px solid var(--border)",
                          borderRadius: 10,
                          padding: "12px 16px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: "var(--bright)" }}>{n.name}</div>
                          <div style={{ fontSize: 12, color: "var(--muted)" }}>{n.host}:{n.port} · {n.region}</div>
                        </div>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
                            className="chk-apply"
                            onClick={() => {
                              setNodeToEdit(n);
                              setNodeForm({
                                name: n.name,
                                region: n.region,
                                host: n.host,
                                port: n.port,
                                policyMode: n.policyMode,
                                status: n.status,
                              });
                              setNodeModalOpen(true);
                            }}
                            style={{ padding: "4px 10px" }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="chk-apply"
                            onClick={() => handleDeleteNode(n.id)}
                            disabled={isPending(`delete-node:${n.id}`)}
                            style={{ padding: "4px 10px", borderColor: "var(--accent)", color: "var(--accent)", opacity: isPending(`delete-node:${n.id}`) ? 0.6 : 1 }}
                          >
                            {isPending(`delete-node:${n.id}`) ? "…" : "Delete"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="chk-hint">No nodes provisioned for this user yet.</p>
                )}
              </div>
            )}

            {/* TAB: PURCHASES */}
            {userModalTab === "payments" && (
              <div>
                <div className="chk-label" style={{ marginBottom: 10 }}>Invoices & Transactions</div>
                {payments.filter((p) => p.userId === selectedUser.uid || p.userId === selectedUser.id).length ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {payments
                      .filter((p) => p.userId === selectedUser.uid || p.userId === selectedUser.id)
                      .map((p) => (
                        <div
                          key={p.id}
                          style={{
                            background: "var(--void)",
                            border: "1px solid var(--border)",
                            borderRadius: 10,
                            padding: "12px 16px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, color: "var(--bright)" }}>
                              {p.plan} plan · ₹{p.amountInr.toLocaleString("en-IN")}
                            </div>
                            <div style={{ fontSize: 12, color: "var(--muted)" }}>{formatDate(p.createdAt)}</div>
                          </div>
                          <button
                            type="button"
                            className="chk-apply"
                            onClick={() => downloadInvoicePdf(p, selectedUser)}
                            style={{ padding: "6px 14px" }}
                          >
                            Download PDF
                          </button>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="chk-hint">No purchases on record for this user.</p>
                )}
              </div>
            )}

            {/* TAB: PROFILE */}
            {userModalTab === "profile" && selectedUser && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {(() => {
                  const draft = profileDraft ?? {
                    firstName: selectedUser.firstName || "",
                    lastName: selectedUser.lastName || "",
                    company: selectedUser.company || "",
                    adminNotes: selectedUser.adminNotes || "",
                  };
                  const updateDraft = (patch: Partial<typeof draft>) =>
                    setProfileDraft({ ...draft, ...patch });
                  return (
                    <>
                      <div className="chk-fields">
                        <div className="chk-field">
                          <label className="chk-label">First Name</label>
                          <input
                            type="text"
                            value={draft.firstName}
                            onChange={(e) => updateDraft({ firstName: e.target.value })}
                          />
                        </div>
                        <div className="chk-field">
                          <label className="chk-label">Last Name</label>
                          <input
                            type="text"
                            value={draft.lastName}
                            onChange={(e) => updateDraft({ lastName: e.target.value })}
                          />
                        </div>
                        <div className="chk-field chk-field--span">
                          <label className="chk-label">Company</label>
                          <input
                            type="text"
                            value={draft.company}
                            onChange={(e) => updateDraft({ company: e.target.value })}
                          />
                        </div>
                        <div className="chk-field chk-field--span">
                          <label className="chk-label">Admin Notes</label>
                          <input
                            type="text"
                            value={draft.adminNotes}
                            onChange={(e) => updateDraft({ adminNotes: e.target.value })}
                            placeholder="Internal notes…"
                          />
                        </div>
                      </div>

                      {/* Single Save — one backend request with only changed fields */}
                      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 10 }}>
                        {profileDraft !== null && (
                          <span style={{ fontSize: 11, color: "var(--accent)" }}>Unsaved changes</span>
                        )}
                        <button
                          type="button"
                          className="chk-apply"
                          onClick={() => setProfileDraft(null)}
                          disabled={!profileDraft || isPending(`profile:${selectedUser.uid}`)}
                          style={{ padding: "8px 16px" }}
                        >
                          Reset
                        </button>
                        <button
                          type="button"
                          className="chk-pay"
                          onClick={applyProfileChanges}
                          disabled={!profileDraft || isPending(`profile:${selectedUser.uid}`)}
                          style={{ width: "auto", padding: "8px 20px", marginTop: 0, opacity: isPending(`profile:${selectedUser.uid}`) ? 0.7 : 1 }}
                        >
                          {isPending(`profile:${selectedUser.uid}`) ? "Saving…" : "Save Changes"}
                        </button>
                      </div>
                    </>
                  );
                })()}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                  <div>
                    <div className="chk-label">Account status</div>
                    <p className="chk-hint">{selectedUser.isBanned ? "Account is suspended" : "Account is active"}</p>
                  </div>
                  <button
                    type="button"
                    className="chk-apply"
                    onClick={() => handleToggleBanUser(selectedUser.uid, !selectedUser.isBanned)}
                    disabled={isPending(`ban:${selectedUser.uid}`)}
                    style={{
                      padding: "8px 18px",
                      borderColor: selectedUser.isBanned ? "var(--ok, #28c840)" : "var(--accent)",
                      color: selectedUser.isBanned ? "var(--ok, #28c840)" : "var(--accent)",
                      opacity: isPending(`ban:${selectedUser.uid}`) ? 0.6 : 1,
                    }}
                  >
                    {isPending(`ban:${selectedUser.uid}`)
                      ? "Updating…"
                      : selectedUser.isBanned
                        ? "Reactivate account"
                        : "Suspend user"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NODE MODAL */}
      {nodeModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(5, 5, 7, 0.75)",
            padding: 20,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setNodeModalOpen(false);
          }}
        >
          <div className="chk-card" style={{ width: "100%", maxWidth: 440, padding: 28 }}>
            <h3 className="chk-card-title">{nodeToEdit ? "Edit Node" : "Add Enforcement Node"}</h3>
            <form onSubmit={handleSaveNode} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="chk-field">
                <label className="chk-label">Node Name</label>
                <input
                  type="text"
                  value={nodeForm.name}
                  onChange={(e) => setNodeForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
              <div className="chk-field">
                <label className="chk-label">Region</label>
                <input
                  type="text"
                  value={nodeForm.region}
                  onChange={(e) => setNodeForm((p) => ({ ...p, region: e.target.value }))}
                  required
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
                <div className="chk-field">
                  <label className="chk-label">Host</label>
                  <input
                    type="text"
                    value={nodeForm.host}
                    onChange={(e) => setNodeForm((p) => ({ ...p, host: e.target.value }))}
                    required
                  />
                </div>
                <div className="chk-field">
                  <label className="chk-label">Port</label>
                  <input
                    type="number"
                    value={nodeForm.port}
                    onChange={(e) => setNodeForm((p) => ({ ...p, port: Number(e.target.value) }))}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
                <button type="button" className="chk-apply" onClick={() => setNodeModalOpen(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="chk-pay"
                  disabled={isPending("save-node")}
                  style={{ width: "auto", padding: "8px 20px", marginTop: 0, opacity: isPending("save-node") ? 0.7 : 1 }}
                >
                  {isPending("save-node") ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* NEW USER MODAL */}
      {newUserModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(5, 5, 7, 0.75)",
            padding: 20,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setNewUserModalOpen(false);
          }}
        >
          <div className="chk-card" style={{ width: "100%", maxWidth: 460, padding: 28 }}>
            <h3 className="chk-card-title">Create User</h3>
            <form onSubmit={handleCreateNewUser} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="chk-field">
                <label className="chk-label">Email</label>
                <input
                  type="email"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm((p) => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div className="chk-field">
                  <label className="chk-label">First Name</label>
                  <input
                    type="text"
                    value={newUserForm.firstName}
                    onChange={(e) => setNewUserForm((p) => ({ ...p, firstName: e.target.value }))}
                  />
                </div>
                <div className="chk-field">
                  <label className="chk-label">Last Name</label>
                  <input
                    type="text"
                    value={newUserForm.lastName}
                    onChange={(e) => setNewUserForm((p) => ({ ...p, lastName: e.target.value }))}
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div className="chk-field">
                  <label className="chk-label">Plan</label>
                  <select
                    value={newUserForm.plan}
                    onChange={(e) => setNewUserForm((p) => ({ ...p, plan: e.target.value as AdminUserRecord["plan"] }))}
                    style={{
                      background: "var(--void)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      padding: "12px 14px",
                      color: "var(--text)",
                    }}
                  >
                    <option value="free">Free</option>
                    <option value="starter">Starter</option>
                    <option value="teams">Teams</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div className="chk-field">
                  <label className="chk-label">Nodes</label>
                  <input
                    type="number"
                    value={newUserForm.nodes}
                    onChange={(e) => setNewUserForm((p) => ({ ...p, nodes: Number(e.target.value) }))}
                    min={1}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
                <button type="button" className="chk-apply" onClick={() => setNewUserModalOpen(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="chk-pay"
                  disabled={isPending("create-user")}
                  style={{ width: "auto", padding: "8px 20px", marginTop: 0, opacity: isPending("create-user") ? 0.7 : 1 }}
                >
                  {isPending("create-user") ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BAN IP MODAL */}
      {banModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(5, 5, 7, 0.75)",
            padding: 20,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setBanModalOpen(false);
          }}
        >
          <div className="chk-card" style={{ width: "100%", maxWidth: 420, padding: 28 }}>
            <h3 className="chk-card-title">Ban IP Address</h3>
            <form onSubmit={handleManualBan} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="chk-field">
                <label className="chk-label">IP Address</label>
                <input
                  type="text"
                  value={banForm.ip}
                  onChange={(e) => setBanForm((p) => ({ ...p, ip: e.target.value }))}
                  placeholder="e.g. 192.168.1.1"
                  required
                />
              </div>
              <div className="chk-field">
                <label className="chk-label">Duration (Minutes)</label>
                <input
                  type="number"
                  value={banForm.durationMinutes}
                  onChange={(e) => setBanForm((p) => ({ ...p, durationMinutes: Number(e.target.value) }))}
                  min={1}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
                <button type="button" className="chk-apply" onClick={() => setBanModalOpen(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="chk-pay"
                  disabled={isPending("manual-ban")}
                  style={{ width: "auto", padding: "8px 20px", marginTop: 0, opacity: isPending("manual-ban") ? 0.7 : 1 }}
                >
                  {isPending("manual-ban") ? "Enforcing…" : "Enforce Ban"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
