"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { firebaseEnabled, getFirebaseAuth } from "@/lib/firebase";

function NavHoverLink({ href, label, active }: { href: string; label: string; active?: boolean }) {
  const isActive = active ?? false;
  return (
    <Link
      href={href}
      style={{
        display: "inline-flex",
        alignItems: "center",
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
      {label}
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(false);
  const [user, setUser] = useState<User | null>(null);

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
    const unsub = onAuthStateChanged(auth, setUser);
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
            <NavHoverLink href="/team" label="Team" active={isActive("/team")} />
            {user && <NavHoverLink href="/dashboard" label="Dashboard" active={isActive("/dashboard")} />}
            <NavHoverLink href="/privacy" label="Privacy" active={isActive("/privacy")} />
            <NavHoverLink href="/terms" label="Terms" active={isActive("/terms")} />
            <NavHoverLink href="/downloads" label="Downloads" active={isActive("/downloads")} />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.9rem" }}>
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
          </div>
        </div>
      </nav>
      <style>{`@media (max-width: 860px) { .nav-links-center { display: none !important; } }`}</style>
    </>
  );
}
