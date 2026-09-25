"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signup } from "@/content/copy";

export default function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");

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
    <section className="section signup" id="early-access" aria-labelledby="signup-title">
      <div className="signup-inner">
        <div>
          <h2 className="section-title" id="signup-title">{signup.title}</h2>
        </div>
        <div>
          <form className="signup-form" onSubmit={submit} aria-label="Newsletter subscription">
            <div className="signup-field">
              <input
                type="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={state === "sending"}
                aria-label="Email address"
              />
              <button type="submit" className="signup-go" disabled={state === "sending"}>
                {state === "sending" ? "Sending…" : "Subscribe →"}
              </button>
            </div>
          </form>
          {state === "error" ? (
            <p role="alert" className="signup-error">
              Request failed. Try again, or email us directly.
            </p>
          ) : (
            <p className="signup-note">One honest issue a month · unsubscribe anytime</p>
          )}
        </div>
      </div>
    </section>
  );
}
