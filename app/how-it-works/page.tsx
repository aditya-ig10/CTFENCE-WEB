import Link from "next/link";
import { Reveal, RevealGroup } from "@/components/Reveal";
import { baseMetadata } from "@/lib/seo";
import WebPageSchema from "@/components/WebPageSchema";

export const metadata = baseMetadata({
  title: "How it works",
  description:
    "Install Context Fence, point your agent through it, and it blocks secrets before they leave your machine. Today it protects MCP tools. Version 2.1 is coming.",
  keywords: [
    "how context fence works",
    "AI agent DLP",
    "stop AI agent secret leaks",
    "local AI agent firewall",
  ],
  path: "/how-it-works",
});

const STEPS = [
  {
    no: "01",
    title: "Install it.",
    body: "Get the app for your computer from the downloads page. It takes minutes, and there is no account to create for the free plan.",
  },
  {
    no: "02",
    title: "Point your agent through it.",
    body: "Send your agent's tool calls through Context Fence. It reads your rule file and learns what to block.",
  },
  {
    no: "03",
    title: "It blocks and logs.",
    body: "A bad call is stopped before it runs. Every decision lands in a log on your machine, with the rule that fired it.",
  },
];

export default function HowItWorksPage() {
  return (
    <main>
      <WebPageSchema
        name="How it works"
        description="Install Context Fence, point your agent through it, and it blocks secrets before they leave your machine."
        path="/how-it-works"
      />
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "clamp(56px, 8vw, 104px) 24px 4rem" }}>
        <Reveal>
        <div className="section-eyebrow">{"// how it works"}</div>
        <h1
          className="section-title"
          style={{ fontSize: "clamp(40px, 6vw, 68px)", maxWidth: 720 }}
        >
          Three steps. Your secrets stay home.
        </h1>
        </Reveal>

        <RevealGroup style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))", gap: 16, marginTop: "2.5rem" }}>
          {STEPS.map((s) => (
            <div key={s.no} style={{ border: "1px solid var(--rule)", borderRadius: 16, padding: "1.6rem", background: "var(--white)" }}>
              <div style={{ fontFamily: "DM Mono, monospace", fontSize: "0.72rem", letterSpacing: "0.1em", color: "#ef4444", fontWeight: 600 }}>
                {s.no}
              </div>
              <h2 style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: "1.4rem", color: "var(--ink)", margin: "0.6rem 0" }}>
                {s.title}
              </h2>
              <p style={{ fontFamily: "DM Mono, monospace", fontWeight: 300, fontSize: "0.8rem", lineHeight: 1.7, color: "var(--ink3)", margin: 0 }}>
                {s.body}
              </p>
            </div>
          ))}
        </RevealGroup>

        <Reveal>
        <div style={{ border: "1px solid var(--rule)", borderRadius: 16, padding: "clamp(24px, 4vw, 44px)", marginTop: 16, background: "var(--off)" }}>
          <div style={{ fontFamily: "DM Mono, monospace", fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink4)", marginBottom: "1.2rem" }}>
            The path of a blocked call
          </div>
          <div style={{ display: "flex", alignItems: "stretch", gap: 0, flexWrap: "wrap" }}>
            {[
              { t: "Your AI agent", s: "Tries to read a .env file" },
              { t: "Context Fence", s: "Sees secrets, strips them" },
              { t: "Outside world", s: "Only clean calls pass" },
            ].map((b, i, arr) => (
              <div key={b.t} style={{ flex: "1 1 180px", display: "flex", alignItems: "center", gap: 0 }}>
                <div style={{ flex: 1, border: "1px solid var(--rule)", borderRadius: 12, padding: "1.1rem 1.2rem", background: "var(--white)", minWidth: 0 }}>
                  <div style={{ fontFamily: "Fraunces, serif", fontWeight: 600, fontSize: "1rem", color: "var(--ink)" }}>{b.t}</div>
                  <div style={{ fontFamily: "DM Mono, monospace", fontSize: "0.72rem", color: "var(--ink3)", marginTop: 4 }}>{b.s}</div>
                </div>
                {i < arr.length - 1 && (
                  <span aria-hidden="true" style={{ fontFamily: "DM Mono, monospace", color: "#ef4444", padding: "0 10px", flexShrink: 0 }}>→</span>
                )}
              </div>
            ))}
          </div>
          <p style={{ fontFamily: "DM Mono, monospace", fontSize: "0.72rem", color: "var(--ink4)", marginTop: "1.2rem", marginBottom: 0 }}>
            Today: an agent tries to read a .env file. Context Fence sees the secrets and strips them before anything leaves.
          </p>
        </div>
        </Reveal>

        <div style={{ border: "1px solid var(--rule)", borderRadius: 16, padding: "1.6rem", marginTop: 16, background: "var(--white)" }}>
          <span style={{ background: "var(--ink)", color: "var(--white)", borderRadius: 999, padding: "2px 10px", fontFamily: "DM Mono, monospace", fontSize: "0.62rem", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Coming in v2.1
          </span>
          <p style={{ fontFamily: "DM Mono, monospace", fontWeight: 300, fontSize: "0.8rem", lineHeight: 1.7, color: "var(--ink3)", margin: "0.8rem 0 0" }}>
            The same check for prompts, files, browser actions, and more tools. Join the newsletter on the home page to hear when it ships.
          </p>
        </div>

        <div style={{ marginTop: "2rem" }}>
          <Link
            href="/downloads"
            style={{
              display: "inline-flex",
              background: "#ef4444",
              color: "white",
              padding: "0.85rem 1.6rem",
              borderRadius: 999,
              fontFamily: "DM Mono, monospace",
              fontSize: "0.68rem",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              textDecoration: "none",
            }}
          >
            Download now →
          </Link>
        </div>
      </div>
    </main>
  );
}
