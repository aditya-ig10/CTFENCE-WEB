"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { motionAllowed } from "@/lib/anim";
import {
  OPEN_SETTINGS_EVENT,
  getConsent,
  isGpcActive,
  setConsent,
} from "@/lib/consent";

// Consent banner + granular asker. The banner docks bottom-right and offers
// accept / reject / customize. Customize opens the asker modal with per
// purpose toggles. Essential storage (theme, consent record) is always on;
// analytics (Google Analytics) only loads after an explicit opt-in —
// GaTag reads the same record. GPC signals are honored as a decline.
export default function CookieToast() {
  const bannerRef = useRef<HTMLDivElement>(null);
  const askerRef = useRef<HTMLDivElement>(null);
  const askerTitleRef = useRef<HTMLHeadingElement>(null);
  const [banner, setBanner] = useState(false);
  const [asker, setAsker] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [gpc] = useState(() => isGpcActive());
  const decidedRef = useRef(false);

  useEffect(() => {
    decidedRef.current = getConsent() !== null;
    if (decidedRef.current) return;
    const t = setTimeout(() => setBanner(true), 900);
    return () => clearTimeout(t);
  }, []);

  const openAsker = useCallback(() => {
    setAnalytics(getConsent()?.analytics ?? false);
    setBanner(false);
    setAsker(true);
  }, []);

  useEffect(() => {
    window.addEventListener(OPEN_SETTINGS_EVENT, openAsker);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, openAsker);
  }, [openAsker]);

  useEffect(() => {
    if (!banner || !motionAllowed() || !bannerRef.current) return;
    gsap.fromTo(
      bannerRef.current,
      { y: 24, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.55, ease: "power3.out" }
    );
  }, [banner]);

  useEffect(() => {
    if (!asker) return;
    if (motionAllowed() && askerRef.current) {
      gsap.fromTo(
        askerRef.current,
        { y: 16, scale: 0.98, autoAlpha: 0 },
        { y: 0, scale: 1, autoAlpha: 1, duration: 0.35, ease: "power3.out" }
      );
    }
    askerTitleRef.current?.focus();
  }, [asker]);

  useEffect(() => {
    if (!asker) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAsker();
    };
    window.addEventListener("keydown", onKey);
    // Lock background scroll while the asker is open (matters most on
    // mobile, where the page behind a modal otherwise keeps scrolling).
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [asker]);

  function animateOutBanner(done: () => void) {
    if (bannerRef.current && motionAllowed()) {
      gsap.to(bannerRef.current, {
        y: 12,
        autoAlpha: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: done,
      });
    } else {
      done();
    }
  }

  function decide(value: boolean) {
    setConsent(gpc ? false : value);
    decidedRef.current = true;
    animateOutBanner(() => setBanner(false));
    setAsker(false);
  }

  function closeAsker() {
    setAsker(false);
    // No decision stored yet → the banner comes back, so consent is never
    // silently skipped.
    if (!decidedRef.current && getConsent() === null) setBanner(true);
  }

  return (
    <>
      {banner && !asker && (
        <div
          ref={bannerRef}
          className="cookie-banner"
          role="region"
          aria-label="Cookie consent"
        >
          <span className="cookie-banner-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="12" cy="12" r="9" />
              <circle cx="8.5" cy="9" r="1.1" fill="currentColor" stroke="none" />
              <circle cx="14" cy="7" r="1.1" fill="currentColor" stroke="none" />
              <circle cx="15" cy="13" r="1.1" fill="currentColor" stroke="none" />
              <circle cx="9.5" cy="15" r="1.1" fill="currentColor" stroke="none" />
              <path d="M13.5 17.5l.6.6M18 10.5l.6.6" strokeLinecap="round" />
            </svg>
          </span>
          <div className="cookie-banner-body">
            <span className="cookie-banner-eyebrow">{"// cookies"}</span>
            <p className="cookie-banner-title">We keep it light.</p>
            <p className="cookie-banner-text">
              Essential storage only (theme, this choice). Analytics runs only
              if you allow it.{" "}
              <Link className="cookie-banner-link" href="/privacy#cookie-policy">
                Cookie policy
              </Link>
            </p>
            <div className="cookie-banner-actions">
              <button type="button" className="cookie-banner-accept" onClick={() => decide(true)}>
                Accept all
              </button>
              <button type="button" className="cookie-banner-reject" onClick={() => decide(false)}>
                Reject
              </button>
              <button type="button" className="cookie-banner-customize" onClick={openAsker}>
                Customize
              </button>
            </div>
          </div>
        </div>
      )}

      {asker && (
        <div className="cookie-asker-overlay" onClick={closeAsker}>
          <div
            ref={askerRef}
            className="cookie-asker"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-asker-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cookie-asker-head">
              <div>
                <span className="cookie-banner-eyebrow">{"// cookie settings"}</span>
                <h2
                  id="cookie-asker-title"
                  ref={askerTitleRef}
                  tabIndex={-1}
                  className="cookie-asker-title"
                >
                  Choose what you share.
                </h2>
              </div>
              <button type="button" className="cookie-asker-close" onClick={closeAsker} aria-label="Close cookie settings">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="cookie-asker-sub">
              Essential storage keeps the site working and remembers this
              choice — it cannot be switched off. {gpc
                ? "We detected a Global Privacy Control signal, so analytics stays off."
                : "Analytics counts visits in aggregate and only runs with your permission."}
            </p>

            <div className="cookie-asker-row">
              <div>
                <div className="cookie-asker-row-title">Essential</div>
                <div className="cookie-asker-row-text">Theme preference, consent record. No tracking.</div>
              </div>
              <span className="cookie-switch cookie-switch-locked" aria-label="Essential cookies always on">
                <span className="cookie-switch-knob" />
                <span className="cookie-switch-state">On</span>
              </span>
            </div>

            <div className="cookie-asker-row">
              <div>
                <div className="cookie-asker-row-title">Analytics</div>
                <div className="cookie-asker-row-text">Google Analytics — aggregate visit counts, popular pages, broad geography.</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={analytics && !gpc}
                aria-label="Analytics cookies"
                disabled={gpc}
                className={`cookie-switch${analytics && !gpc ? " cookie-switch-on" : ""}${gpc ? " cookie-switch-disabled" : ""}`}
                onClick={() => setAnalytics((v) => !v)}
              >
                <span className="cookie-switch-knob" />
                <span className="cookie-switch-state">{analytics && !gpc ? "On" : "Off"}</span>
              </button>
            </div>

            <div className="cookie-asker-actions">
              <button type="button" className="cookie-banner-accept" onClick={() => decide(analytics)}>
                Save choices
              </button>
              <button type="button" className="cookie-banner-reject" onClick={() => decide(true)}>
                Accept all
              </button>
            </div>

            <Link className="cookie-banner-link" href="/privacy#cookie-policy" onClick={closeAsker}>
              Read the full cookie policy →
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
