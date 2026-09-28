"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, type User } from "firebase/auth";
import { Download, FileText, LayoutDashboard, ShieldCheck, Users } from "lucide-react";
import { firebaseEnabled, getFirebaseAuth } from "@/lib/firebase";

// Last-known sign-in, persisted locally on every auth change (cookie first,
// localStorage as backup). The auth slot renders an identical neutral
// placeholder on the server and first client pass — then swaps to the cached
// hint instantly on mount — so launch never flashes the wrong control and
// never hydration-mismatches. Firebase confirms a beat later.
const AUTH_HINT_KEY = "cf-auth";
function readAuthHint(): boolean {
  try {
    return (
      localStorage.getItem(AUTH_HINT_KEY) === "1" ||
      document.cookie.split("; ").some((c) => c === "cf_auth=1")
    );
  } catch {
    return false;
  }
}
function writeAuthHint(on: boolean) {
  try {
    if (on) {
      localStorage.setItem(AUTH_HINT_KEY, "1");
      document.cookie = "cf_auth=1; path=/; max-age=31536000; SameSite=Lax";
    } else {
      localStorage.removeItem(AUTH_HINT_KEY);
      document.cookie = "cf_auth=; path=/; max-age=0; SameSite=Lax";
    }
  } catch {}
}

function NavHoverLink({ href, label, active, icon }: { href: string; label: string; active?: boolean; icon?: React.ReactNode }) {
  const isActive = active ?? false;
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "0.35rem 0.75rem",
        borderRadius: 999,
        color: isActive ? "var(--white)" : "var(--ink3)",
        background: isActive ? "var(--ink)" : "transparent",
        textDecoration: "none",
        fontFamily: "DM Mono, monospace",
        fontSize: "0.62rem",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        fontWeight: 400,
        transition: "background 0.2s ease, color 0.2s ease",
      }}
    >
      {icon}
      {label}
    </Link>
  );
}

function NavDashboardLink({ href, label, active }: { href: string; label: string; active?: boolean }) {
  const isActive = active ?? false;
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "0.6rem 1.35rem",
        borderRadius: 999,
        color: isActive ? "white" : "#ef4444",
        background: isActive ? "#ef4444" : "rgba(239,68,68,0.1)",
        border: isActive ? "1px solid #ef4444" : "1px solid rgba(239,68,68,0.25)",
        boxShadow: isActive ? "0 4px 14px rgba(239,68,68,0.22)" : "none",
        textDecoration: "none",
        fontFamily: "DM Mono, monospace",
        fontSize: "0.62rem",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        fontWeight: 600,
        whiteSpace: "nowrap",
        transition: "background 0.2s, transform 0.2s, box-shadow 0.2s, border-color 0.2s, color 0.2s",
      }}
      onMouseEnter={(e) => {
        if (isActive) {
          e.currentTarget.style.background = "#dc2626";
          e.currentTarget.style.borderColor = "#dc2626";
        } else {
          e.currentTarget.style.background = "rgba(239,68,68,0.18)";
          e.currentTarget.style.borderColor = "rgba(239,68,68,0.45)";
        }
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0 6px 20px rgba(239,68,68,0.3)";
      }}
      onMouseLeave={(e) => {
        if (isActive) {
          e.currentTarget.style.background = "#ef4444";
          e.currentTarget.style.borderColor = "#ef4444";
          e.currentTarget.style.boxShadow = "0 4px 14px rgba(239,68,68,0.22)";
        } else {
          e.currentTarget.style.background = "rgba(239,68,68,0.1)";
          e.currentTarget.style.borderColor = "rgba(239,68,68,0.25)";
          e.currentTarget.style.boxShadow = "none";
        }
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <LayoutDashboard size={12} strokeWidth={2} aria-hidden="true" />
      {label}
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  // Cached sign-in paints instantly; Firebase confirms a beat later.
  const [authedHint] = useState(readAuthHint);
  const [authLive, setAuthLive] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      const shell = document.querySelector<HTMLElement>(".site-shell");
      if (shell && window.matchMedia("(min-width: 1025px)").matches) {
        if (y > 12) shell.classList.add("is-expanded");
        else shell.classList.remove("is-expanded");
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark") || document.documentElement.getAttribute("data-theme") === "dark";
    setDark(isDark);
  }, []);

  useEffect(() => {
    if (!firebaseEnabled) return;
    const auth = getFirebaseAuth();
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLive(true);
      writeAuthHint(!!u);
    });
    return () => unsub();
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    root.classList.add("theme-transitioning");
    const next = !dark;
    setDark(next);
    root.classList.toggle("dark", next);
    root.classList.toggle("light", !next);
    if (next) {
      root.setAttribute("data-theme", "dark");
    } else {
      root.setAttribute("data-theme", "light");
    }
    try {
      localStorage.setItem("synthrun-theme", next ? "dark" : "light");
      localStorage.setItem("cf-theme", next ? "dark" : "light");
    } catch {}
    window.setTimeout(() => root.classList.remove("theme-transitioning"), 600);
  };

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // Mobile sheet never stays open across navigations.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const signIn = async () => {
    const auth = getFirebaseAuth();
    if (!auth) return;
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      writeAuthHint(true);
      setMenuOpen(false);
    } catch {}
  };

  // Live Firebase state wins; before it resolves, trust the cached hint so
  // launch never flashes the wrong control.
  const showAuthed = !!user || (!authLive && authedHint);

  return (
    <>
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: scrolled ? "var(--nav-bg)" : "var(--white)",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: "1px solid var(--rule)",
          transition: "background 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease",
        }}
      >
        <div
          className="nav-inner"
          style={{
            maxWidth: 1140,
            margin: "0 auto",
            padding: "1.1rem 2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href="/"
            aria-label="Context Fence Homepage"
            style={{
              fontFamily: "Fraunces, serif",
              fontWeight: 200,
              fontSize: "1.05rem",
              letterSpacing: "-0.02em",
              color: "var(--ink)",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
            }}
          >
            <img src="/icon.png" alt="" width={20} height={20} style={{ width: 20, height: 20, objectFit: "contain", display: "block" }} />
            <span>Context Fence</span>
          </Link>

          <div
            className="nav-links-center"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              flex: 1,
              justifyContent: "center",
            }}
          >
            <NavHoverLink href="/team" label="Team" active={isActive("/team")} icon={<Users size={12} strokeWidth={2} aria-hidden="true" />} />
            <NavHoverLink href="/privacy" label="Privacy" active={isActive("/privacy")} icon={<ShieldCheck size={12} strokeWidth={2} aria-hidden="true" />} />
            <NavHoverLink href="/terms" label="Terms" active={isActive("/terms")} icon={<FileText size={12} strokeWidth={2} aria-hidden="true" />} />
            <NavHoverLink href="/downloads" label="Downloads" active={isActive("/downloads")} icon={<Download size={12} strokeWidth={2} aria-hidden="true" />} />
          </div>

          <div className="nav-actions" style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
            <button
              onClick={toggleTheme}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              title={dark ? "Light mode" : "Dark mode"}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                padding: 0,
                background: "transparent",
                border: "1px solid var(--rule)",
                color: "var(--ink2)",
                cursor: "pointer",
                borderRadius: "50%",
                transition: "border-color 0.2s ease, color 0.2s ease, transform 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--ink)";
                e.currentTarget.style.color = "var(--ink)";
                e.currentTarget.style.transform = "scale(1.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--rule)";
                e.currentTarget.style.color = "var(--ink2)";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              {dark ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
              )}
            </button>

            <span className="nav-action-primary" style={{ display: "inline-flex", alignItems: "center" }}>
            <Link
              href="/downloads"
              style={{
                fontFamily: "DM Mono, monospace",
                fontSize: "0.62rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                textDecoration: "none",
                background: "#ef4444",
                color: "white",
                padding: "0.6rem 1.35rem",
                borderRadius: 999,
                transition: "background 0.2s, transform 0.2s, box-shadow 0.2s",
                display: "inline-flex",
                alignItems: "center",
                boxShadow: "0 4px 14px rgba(239,68,68,0.22)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#dc2626";
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 6px 20px rgba(239,68,68,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#ef4444";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 14px rgba(239,68,68,0.22)";
              }}
            >
              Download
            </Link>
            </span>
            <span className="nav-action-primary" style={{ display: "inline-flex", alignItems: "center" }}>
            {!mounted ? (
              <span
                aria-hidden="true"
                style={{
                  display: "inline-flex",
                  width: 118,
                  height: 33,
                  borderRadius: 999,
                  border: "1px solid var(--rule)",
                  background: "var(--off)",
                }}
              />
            ) : showAuthed ? (
              <NavDashboardLink href="/dashboard" label="Dashboard" active={isActive("/dashboard")} />
            ) : (
              firebaseEnabled && (
                <button
                  type="button"
                  onClick={signIn}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontFamily: "DM Mono, monospace",
                    fontSize: "0.62rem",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    background: "transparent",
                    color: "var(--ink)",
                    border: "1px solid var(--rule)",
                    padding: "0.6rem 1.2rem",
                    borderRadius: 999,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.2 3.31v2.76h3.57c2.09-1.92 3.3-4.75 3.3-8.08z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-1 7.28-2.69l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.85 0-5.27-1.92-6.14-4.5H2.18v2.84C3.98 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.08.56 4.22 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>
              )
            )}
            </span>
            <button
              type="button"
              className="nav-hamburger"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span aria-hidden="true" />
              <span aria-hidden="true" />
              <span aria-hidden="true" />
            </button>
          </div>
        </div>
        {menuOpen && createPortal(
          <div className="nav-sheet" role="dialog" aria-modal="true" aria-label="Site menu">
            <div className="nav-sheet-top">
              <span className="nav-sheet-eyebrow">{"// menu"}</span>
              <button
                type="button"
                className="nav-sheet-close"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="nav-sheet-links" aria-label="Primary">
              {[
                { href: "/team", label: "Team", icon: <Users size={20} strokeWidth={1.8} aria-hidden="true" /> },
                { href: "/privacy", label: "Privacy", icon: <ShieldCheck size={20} strokeWidth={1.8} aria-hidden="true" /> },
                { href: "/terms", label: "Terms", icon: <FileText size={20} strokeWidth={1.8} aria-hidden="true" /> },
                { href: "/downloads", label: "Downloads", icon: <Download size={20} strokeWidth={1.8} aria-hidden="true" /> },
              ].map((l, i) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className={isActive(l.href) ? "nav-sheet-link nav-sheet-link-active" : "nav-sheet-link"}
                  style={{ animationDelay: `${0.05 + i * 0.05}s` }}
                >
                  <span className="nav-sheet-index">{String(i + 1).padStart(2, "0")}</span>
                  <span className="nav-sheet-icon">{l.icon}</span>
                  <span>{l.label}</span>
                  <span className="nav-sheet-arrow" aria-hidden="true">→</span>
                </Link>
              ))}
            </nav>
            <div className="nav-sheet-actions">
              <Link href="/downloads" onClick={() => setMenuOpen(false)} className="nav-sheet-download">
                <Download size={15} strokeWidth={2} aria-hidden="true" /> Download
              </Link>
              {showAuthed ? (
                <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="nav-sheet-secondary">
                  <LayoutDashboard size={15} strokeWidth={2} aria-hidden="true" /> Dashboard →
                </Link>
              ) : (
                firebaseEnabled && (
                  <button type="button" onClick={signIn} className="nav-sheet-secondary">
                    Continue with Google
                  </button>
                )
              )}
            </div>
            <div className="nav-sheet-foot">Context Fence · Stops AI agents leaking secrets</div>
          </div>,
          document.body
        )}
      </nav>
    </>
  );
}
