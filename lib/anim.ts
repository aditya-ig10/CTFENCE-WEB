// shared motion gate: every JS animation defers to this
export function motionAllowed(): boolean {
  if (typeof window === "undefined") return false;
  return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}