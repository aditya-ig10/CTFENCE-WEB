// Shared route-animation signals. One popstate listener for the whole app:
// the template + Reveal helpers use it to play the shorter back/forward
// variant (250ms, no stagger). Display text and metadata only — no logic.

let popPending = false;
let lastPopAt = 0;
let listening = false;

function ensureListening() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  window.addEventListener("popstate", () => {
    popPending = true;
    lastPopAt = Date.now();
  });
}

// True once if a back/forward navigation caused this mount. Consumes the flag.
export function consumePopNav(): boolean {
  ensureListening();
  const wasPop = popPending;
  popPending = false;
  return wasPop;
}

// True shortly after a back/forward press. Used by scroll-triggered reveals
// so below-fold items also play short when the user arrives via back/forward.
export function wasRecentPop(windowMs = 2500): boolean {
  ensureListening();
  return Date.now() - lastPopAt < windowMs;
}
