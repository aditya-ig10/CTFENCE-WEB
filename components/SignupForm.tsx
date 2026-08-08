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
      <div className="container" style={{ padding: 0 }}>
        <div className="section-eyebrow">{signup.eyebrow}</div>
        <h2 className="section-title" id="signup-title" style={{ marginBottom: 0 }}>{signup.title}</h2>
        <p className="section-lead">{signup.lead}</p>
        <form className="signup-form" onSubmit={submit} aria-label="Early access request">
          <label htmlFor="early-access-email" className="sr-only">
            Work email
          </label>
          <input
            id="early-access-email"
            type="email"
            required
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={state === "sending"}
          />
          <button type="submit" className="btn-primary" disabled={state === "sending"}>
            {state === "sending" ? "Sending..." : signup.submit}
          </button>
        </form>
        {state === "error" && (
          <p role="alert" style={{ color: "var(--accent)", fontSize: 12, marginBottom: 8 }}>
            Request failed. Try again, or email us directly.
          </p>
        )}
        <p className="signup-note">{signup.note}</p>
      </div>
    </section>
  );
}