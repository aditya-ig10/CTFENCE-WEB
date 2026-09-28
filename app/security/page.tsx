import Link from "next/link";
import { Reveal, RevealGroup } from "@/components/Reveal";
import { baseMetadata } from "@/lib/seo";
import WebPageSchema from "@/components/WebPageSchema";

export const metadata = baseMetadata({
  title: "Security",
  description:
    "What leaves your machine? Nothing. What stays local, what the website collects, and what the log holds.",
  keywords: [
    "AI agent DLP",
    "local AI agent firewall",
    "AI agent security",
    "stop AI agent secret leaks",
  ],
  path: "/security",
});

const STAYS = [
  "Your agent's tool calls, allowed or denied",
  "Secrets the fence strips before they reach a model",
  "The log rows and the rules that decided them",
  "Your rule file, which we never see",
];

export default function SecurityPage() {
  return (
    <main>
      <WebPageSchema
        name="Security"
        description="What leaves your machine? Nothing. What stays local, what the website collects, and what the log holds."
        path="/security"
      />
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "clamp(56px, 8vw, 104px) 24px 4rem" }}>
        <Reveal>
        <div className="section-eyebrow">{"// security"}</div>
        <h1
          className="section-title"
          style={{ fontSize: "clamp(40px, 6vw, 68px)", maxWidth: 760 }}
        >
          What leaves your machine? Nothing.
        </h1>
        <p className="section-lead" style={{ maxWidth: 600 }}>
          Context Fence runs on your computer. Your data stays there too.
        </p>
        </Reveal>

        <RevealGroup style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))", gap: 16, marginTop: "2.5rem" }}>
          <div style={{ border: "1px solid var(--rule)", borderRadius: 16, padding: "1.6rem", background: "var(--white)" }}>
            <h2 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: "1.3rem", color: "var(--ink)", margin: "0 0 0.9rem" }}>
              Stays on your machine
            </h2>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.65rem" }}>
              {STAYS.map((t) => (
                <li key={t} style={{ display: "flex", gap: 10, fontFamily: "DM Mono, monospace", fontWeight: 300, fontSize: "0.78rem", lineHeight: 1.6, color: "var(--ink2)" }}>
                  <span aria-hidden="true" style={{ color: "#10b981", flexShrink: 0 }}>✓</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div style={{ border: "1px solid var(--rule)", borderRadius: 16, padding: "1.6rem", background: "var(--white)" }}>
            <h2 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: "1.3rem", color: "var(--ink)", margin: "0 0 0.9rem" }}>
              What the website collects
            </h2>
            <p style={{ fontFamily: "DM Mono, monospace", fontWeight: 300, fontSize: "0.78rem", lineHeight: 1.7, color: "var(--ink3)", margin: 0 }}>
              Visit counts only. We see rough numbers, popular pages, and broad regions. We do not see who you are, and we do not try to.
            </p>
          </div>
          <div style={{ border: "1px solid var(--rule)", borderRadius: 16, padding: "1.6rem", background: "var(--white)" }}>
            <h2 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: "1.3rem", color: "var(--ink)", margin: "0 0 0.9rem" }}>
              What the log holds
            </h2>
            <p style={{ fontFamily: "DM Mono, monospace", fontWeight: 300, fontSize: "0.78rem", lineHeight: 1.7, color: "var(--ink3)", margin: 0 }}>
              Each row names the rule that fired, on your disk only. There is no cloud copy. Retention is your call.
            </p>
          </div>
        </RevealGroup>

        <p style={{ fontFamily: "DM Mono, monospace", fontSize: "0.78rem", color: "var(--ink3)", marginTop: "2rem" }}>
          The full rules live in{" "}
          <Link href="/privacy" style={{ color: "var(--ink)", textDecoration: "underline", textUnderlineOffset: 3 }}>
            Privacy
          </Link>{" "}
          and{" "}
          <Link href="/terms" style={{ color: "var(--ink)", textDecoration: "underline", textUnderlineOffset: 3 }}>
            Terms
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
