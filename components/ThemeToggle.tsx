"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import { applyTheme, getStoredTheme, setStoredTheme, systemTheme, type Theme } from "@/lib/theme";

function prefersReduced(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const boxRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const stored = getStoredTheme();
    const t = stored ?? systemTheme();
    applyTheme(t);
    setTheme(t);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
    setStoredTheme(next);

    const box = boxRef.current;
    if (prefersReduced() || !box) return;
    const sun = box.querySelector("[data-glyph=sun]");
    const moon = box.querySelector("[data-glyph=moon]");
    if (!sun || !moon) return;

    animate([sun, moon], {
      opacity: [
        { value: 0, duration: 80 },
        { value: 1, duration: 120, delay: 80 },
      ],
      rotate: next === "light" ? [0, 180] : [0, -180],
      duration: 200,
      easing: "easeOutQuad",
      complete() {
        animate([sun, moon], { rotate: 0, duration: 0 });
      },
    });
  }

  const label = theme === "dark" ? "switch to light mode" : "switch to dark mode";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      <span ref={boxRef} className="relative inline-flex w-4 h-4">
        <svg
          data-glyph="moon"
          className="absolute inset-0"
          style={{ opacity: theme === "dark" ? 1 : 0 }}
          width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"
        >
          <path d="M11.6 9.4A4.6 4.6 0 0 1 6.6 4.4a4.6 4.6 0 1 0 5 5Z" fill="currentColor" />
        </svg>
        <svg
          data-glyph="sun"
          className="absolute inset-0"
          style={{ opacity: theme === "dark" ? 0 : 1 }}
          width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"
        >
          <circle cx="8" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.4" />
          <path
            d="M8 1.4v1.4M8 13.2v1.4M1.4 8h1.4M13.2 8h1.4M3 3l1 1M12 12l1 1M13 3l-1 1M4 12l-1 1"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="square"
          />
        </svg>
      </span>
    </button>
  );
}