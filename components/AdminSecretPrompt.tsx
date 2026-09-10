"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { firebaseEnabled, getFirebaseAuth } from "@/lib/firebase";
import { ADMIN_EMAIL, ADMIN_KEYWORD_SHA256 } from "@/lib/adminConstants";

async function sha256(str: string): Promise<string> {
  try {
    const enc = new TextEncoder().encode(str);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return "";
  }
}

export default function AdminSecretPrompt() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBanned, setIsBanned] = useState(false);
  const [banSecondsLeft, setBanSecondsLeft] = useState(0);

  const keyBufferRef = useRef<string>("");

  useEffect(() => {
    if (!firebaseEnabled) return;
    const auth = getFirebaseAuth();
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
    });
    return () => unsub();
  }, []);

  // Check localStorage for ban timer
  useEffect(() => {
    try {
      const storedBanUntil = localStorage.getItem("cf_admin_ban_until");
      if (storedBanUntil) {
        const banUntil = parseInt(storedBanUntil, 10);
        const now = Date.now();
        if (banUntil > now) {
          setIsBanned(true);
          setBanSecondsLeft(Math.ceil((banUntil - now) / 1000));
        } else {
          localStorage.removeItem("cf_admin_ban_until");
        }
      }
    } catch {}
  }, []);

  // Ban countdown ticker
  useEffect(() => {
    if (!isBanned || banSecondsLeft <= 0) return;
    const timer = setInterval(() => {
      setBanSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsBanned(false);
          localStorage.removeItem("cf_admin_ban_until");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isBanned, banSecondsLeft]);

  // Keystroke listener using cryptographic one-way SHA-256 hash matching
  // (No plaintext keyword in client bundles, completely silent for non-admin)
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === "INPUT" ||
        activeEl?.tagName === "TEXTAREA" ||
        activeEl?.getAttribute("contenteditable") === "true";

      if (isInput && isOpen) return;

      if (e.key && e.key.length === 1) {
        keyBufferRef.current = (keyBufferRef.current + e.key.toLowerCase()).slice(-25);

        // Check if user is logged in as ssynthrun@gmail.com
        const currentEmail = currentUser?.email?.toLowerCase().trim();
        if (currentEmail !== ADMIN_EMAIL.toLowerCase().trim()) {
          return; // Completely silent
        }

        // Test recent substrings against one-way SHA-256 hash
        const buf = keyBufferRef.current;
        for (let len = 6; len <= Math.min(18, buf.length); len++) {
          const sub = buf.slice(-len);
          const hash = await sha256(sub);
          if (hash === ADMIN_KEYWORD_SHA256) {
            keyBufferRef.current = "";
            setIsOpen(true);
            setErrorMessage(null);
            break;
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentUser]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim() || isBanned) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const email = currentUser?.email || ADMIN_EMAIL;
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        setPassword("");
        setIsOpen(false);
        router.push(data.magicUrl);
      } else {
        if (data.banned) {
          setIsBanned(true);
          const remaining = data.remainingSeconds || 1800;
          setBanSecondsLeft(remaining);
          try {
            localStorage.setItem("cf_admin_ban_until", String(Date.now() + remaining * 1000));
          } catch {}
          setErrorMessage("Too many attempts. Access locked for 30 minutes.");
        } else {
          setErrorMessage(data.error || "Incorrect password.");
        }
      }
    } catch {
      setErrorMessage("Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(5, 5, 7, 0.75)",
        backdropFilter: "blur(8px)",
        padding: "20px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          setIsOpen(false);
        }
      }}
    >
      <div
        className="chk-card"
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "32px",
          position: "relative",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
        }}
      >
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          style={{
            position: "absolute",
            top: "18px",
            right: "18px",
            background: "none",
            border: "none",
            color: "var(--muted)",
            fontSize: "18px",
            cursor: "pointer",
            padding: "4px",
            lineHeight: 1,
          }}
          title="Close"
        >
          ✕
        </button>

        <div className="chk-eyebrow" style={{ marginBottom: "6px" }}>
          {"// admin access"}
        </div>
        <h2 className="chk-title" style={{ fontSize: "24px", marginBottom: "8px" }}>
          Admin verification
        </h2>
        <p className="chk-sub" style={{ fontSize: "14px", marginBottom: "20px" }}>
          Enter password to open the administration console.
        </p>

        {isBanned ? (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <p className="chk-hint" style={{ color: "var(--accent)", marginBottom: "8px" }}>
              IP lockout active (30 mins)
            </p>
            <div
              style={{
                fontFamily: "var(--font-jetbrains), monospace",
                fontSize: "24px",
                fontWeight: 700,
                color: "var(--bright)",
              }}
            >
              {formatTimer(banSecondsLeft)}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="chk-field">
              <label className="chk-label" htmlFor="admin-pass">Password</label>
              <input
                id="admin-pass"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password…"
                autoFocus
                required
                disabled={loading}
              />
            </div>

            {errorMessage && (
              <p className="chk-hint" style={{ color: "var(--accent)", margin: "0 0 4px" }}>
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              className="chk-pay"
              disabled={loading || !password.trim()}
              style={{ marginTop: "6px" }}
            >
              {loading ? "Verifying…" : "Unlock Admin"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
