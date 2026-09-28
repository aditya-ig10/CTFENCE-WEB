"use client";

import { openCookieSettings } from "@/lib/consent";

// Footer entry point that re-opens the cookie asker so visitors can change
// their choice at any time.
export default function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={openCookieSettings}
      style={{
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
        fontFamily: "DM Mono, monospace",
        fontSize: "0.72rem",
        color: "var(--ink3)",
      }}
    >
      Cookie settings
    </button>
  );
}
