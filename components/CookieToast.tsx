"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { motionAllowed } from "@/lib/anim";

const KEY = "cf-cookies";

// a landing toast, docked bottom-right: one line about what the site stores,
// accept or decline. the choice persists, so it shows once per browser.
export default function CookieToast() {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(KEY)) return;
    const t = setTimeout(() => setShow(true), 900);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!show || !motionAllowed() || !ref.current) return;
    gsap.fromTo(
      ref.current,
      { x: 64, autoAlpha: 0 },
      { x: 0, autoAlpha: 1, duration: 0.6, ease: "back.out(1.7)" }
    );
  }, [show]);

  function dismiss(choice: "accepted" | "declined") {
    localStorage.setItem(KEY, choice);
    if (ref.current && motionAllowed()) {
      gsap.to(ref.current, {
        x: 32,
        autoAlpha: 0,
        duration: 0.35,
        ease: "power2.in",
        onComplete: () => setShow(false),
      });
    } else {
      setShow(false);
    }
  }

  if (!show) return null;

  return (
    <div className="cookie-toast" ref={ref} role="status" aria-live="polite">
      <span className="cookie-toast-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="9" />
          <circle cx="8.5" cy="9" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="14" cy="7" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="15" cy="13" r="1.1" fill="currentColor" stroke="none" />
          <circle cx="9.5" cy="15" r="1.1" fill="currentColor" stroke="none" />
          <path d="M13.5 17.5l.6.6M18 10.5l.6.6" strokeLinecap="round" />
        </svg>
      </span>
      <div className="cookie-toast-body">
        <span className="cookie-toast-eyebrow">{"// cookies"}</span>
        <p className="cookie-toast-title">We keep it light.</p>
        <p className="cookie-toast-text">
          Theme preference and newsletter signup only. Nothing leaves your machine.
        </p>
        <div className="cookie-toast-actions">
          <button type="button" className="cookie-toast-accept" onClick={() => dismiss("accepted")}>
            Accept
          </button>
          <button type="button" className="cookie-toast-decline" onClick={() => dismiss("declined")}>
            No, thanks
          </button>
          <Link className="cookie-toast-fine" href="/privacy">
            fine print
          </Link>
        </div>
      </div>
    </div>
  );
}