// Single source of truth for cookie consent. Stored as versioned JSON so the
// banner, the asker modal, the footer "cookie settings" entry point, and the
// analytics loader (GaTag) all read the same decision.
//
// Shape: { necessary: true, analytics: boolean, ts: ISO string, v: 1 }.
// Analytics defaults to OFF — nothing optional loads until the user opts in.
// A Global Privacy Control signal is honored as a decline.

export type Consent = {
  necessary: true;
  analytics: boolean;
  ts: string;
  v: 1;
};

const KEY = "cf-consent";
const LEGACY_KEY = "cf-cookies";

export const CONSENT_EVENT = "cf:consent";
export const OPEN_SETTINGS_EVENT = "cf:open-cookie-settings";

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function valid(c: unknown): c is Consent {
  if (!c || typeof c !== "object") return false;
  const o = c as Record<string, unknown>;
  return o.necessary === true && typeof o.analytics === "boolean" && o.v === 1;
}

function migrateLegacy(): Consent | null {
  try {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy === "accepted") {
      return { necessary: true, analytics: true, ts: new Date().toISOString(), v: 1 };
    }
    if (legacy === "declined") {
      return { necessary: true, analytics: false, ts: new Date().toISOString(), v: 1 };
    }
  } catch {}
  return null;
}

export function getConsent(): Consent | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (valid(parsed)) return parsed;
    }
    // One-time upgrade from the old accept/decline toast, then persisted.
    const migrated = migrateLegacy();
    if (migrated) {
      try {
        localStorage.setItem(KEY, JSON.stringify(migrated));
        localStorage.removeItem(LEGACY_KEY);
      } catch {}
      return migrated;
    }
  } catch {}
  return null;
}

export function setConsent(analytics: boolean): Consent {
  const consent: Consent = {
    necessary: true,
    analytics,
    ts: new Date().toISOString(),
    v: 1,
  };
  if (isBrowser()) {
    try {
      localStorage.setItem(KEY, JSON.stringify(consent));
      localStorage.removeItem(LEGACY_KEY);
    } catch {}
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: consent }));
  }
  return consent;
}

export function hasAnalyticsConsent(): boolean {
  return getConsent()?.analytics === true;
}

// Global Privacy Control (https://globalprivacycontrol.org) — a browser-level
// "do not track/sell" signal. When present we treat analytics as declined.
export function isGpcActive(): boolean {
  if (!isBrowser()) return false;
  try {
    return (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
  } catch {
    return false;
  }
}

export function openCookieSettings() {
  if (!isBrowser()) return;
  window.dispatchEvent(new CustomEvent(OPEN_SETTINGS_EVENT));
}
