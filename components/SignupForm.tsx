"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { motionAllowed } from "@/lib/anim";
import { signup } from "@/content/copy";

export default function SignupForm() {
  const router = useRouter();
  const rootRef = useRef<HTMLElement>(null);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const img = root.querySelector<HTMLElement>(".signup-pop");
    if (!img || !motionAllowed() || !window.matchMedia("(min-width: 900px)").matches) return;
    gsap.set(img, { y: -56, opacity: 0, scale: 0.92 });
    const yTo = gsap.quickTo(img, "y", { duration: 0.7, ease: "power2.out" });
    const oTo = gsap.quickTo(img, "opacity", { duration: 0.7, ease: "power2.out" });
    const sTo = gsap.quickTo(img, "scale", { duration: 0.7, ease: "power2.out" });
    const update = () => {
      const rect = root.getBoundingClientRect();
      const total = rect.height + window.innerHeight;
      const p = gsap.utils.clamp(0, 1, (window.innerHeight - rect.top) / total);
      const fade = 0.15;
      const opacity = p < fade ? p / fade : p > 1 - fade ? (1 - p) / fade : 1;
      yTo(gsap.utils.mapRange(0, 1, -56, 56, p));
      oTo(opacity);
      sTo(gsap.utils.mapRange(0, fade, 0.92, 1, p));
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      gsap.killTweensOf(img);
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setState("sending");
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("failed");
      router.push("/thank-you");
    } catch {
      setState("error");
    }
  }

  return (
    <section ref={rootRef} className="section signup" id="early-access" aria-labelledby="signup-title">
      <img src="/newsletter/nws.png" alt="" className="signup-pop" loading="lazy" />
      <div className="container" style={{ padding: 0 }}>
        <div className="section-eyebrow">{signup.eyebrow}</div>
        <h2 className="section-title" id="signup-title" style={{ marginBottom: 0 }}>{signup.title}</h2>
        <p className="section-lead">{signup.lead}</p>
        <form className="signup-form" onSubmit={submit} aria-label="Newsletter subscription">
          <div className="signup-field">
            <input
              type="email"
              required
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={state === "sending"}
            />
            <div className="signup-go-wrap">
              <button
                type="submit"
                className="signup-go"
                disabled={state === "sending"}
                aria-label={state === "sending" ? "Sending..." : "Subscribe"}
              >
                <svg className="signup-go-arrow" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" height={50} width={50} aria-hidden="true">
                  <path fillOpacity="0.01" fill="white" d="M63.6689 29.0491L34.6198 63.6685L0.00043872 34.6194L29.0496 1.67708e-05L63.6689 29.0491Z" />
                  <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="3.76603" stroke="white" d="M42.8496 18.7067L21.0628 44.6712" />
                  <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="3.76603" stroke="white" d="M26.9329 20.0992L42.85 18.7067L44.2426 34.6238" />
                </svg>
                <span className="signup-sweep signup-sweep--a" />
                <span className="signup-sweep signup-sweep--b" />
              </button>
            </div>
          </div>
        </form>
        {state === "error" && (
          <p role="alert" style={{ color: "var(--accent)", fontSize: 12, marginBottom: 8 }}>
            Request failed. Try again, or email us directly.
          </p>
        )}
      </div>
    </section>
  );
}