"use client";

export type Theme = "light" | "dark";

export function getStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  try {
    const t = window.localStorage.getItem("cf-theme");
    return t === "light" || t === "dark" ? t : null;
  } catch {
    return null;
  }
}

export function systemTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function applyTheme(t: Theme) {
  document.documentElement.setAttribute("data-theme", t);
}

export function setStoredTheme(t: Theme) {
  try {
    window.localStorage.setItem("cf-theme", t);
  } catch {
    // private mode: ignore
  }
}