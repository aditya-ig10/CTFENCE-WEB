"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { motionAllowed } from "@/lib/anim";

const KEY = "cf-cookies";

// a landing toast: one line about what the site stores, accept or decline.
// the choice persists, so it shows once per browser.
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
      { y: 44, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.6, ease: "back.out(1.6)" }
    );
  }, [show]);

  function dismiss(choice: "accepted" | "declined") {
    localStorage.setItem(KEY, choice);
    if (ref.current && motionAllowed()) {
      gsap.to(ref.current, {
        y: 24,
        autoAlpha: 0,
        duration: 0.4,
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
      <span className="cookie-toast-eyebrow">{"// cookies"}</span>
      <p className="cookie-toast-text">
        We use cookies — theme preference and newsletter signup only. Nothing else leaves your
        machine. <Link href="/privacy">See the fine print.</Link>
      </p>
      <div className="cookie-toast-actions">
        <button type="button" className="cookie-toast-accept" onClick={() => dismiss("accepted")}>
          Accept
        </button>
        <button type="button" className="cookie-toast-decline" onClick={() => dismiss("declined")}>
          Decline
        </button>
      </div>
    </div>
  );
}