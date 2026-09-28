import Link from "next/link";
import { footer } from "@/content/copy";
import CookieSettingsButton from "@/components/CookieSettingsButton";

export default function Footer() {
  return (
    <footer style={{ background: "var(--off)", borderTop: "1px solid var(--rule)", marginTop: "4rem" }}>
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "3.5rem 2rem 2rem" }}>
        <div className="footer-grid" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", gap: "2.5rem 2rem", alignItems: "start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "0.8rem" }}>
              <img src="/icon.png" alt="" width={22} height={22} style={{ width: 22, height: 22, objectFit: "contain" }} />
              <span style={{ fontFamily: "Fraunces, serif", fontWeight: 500, fontSize: "1.15rem", letterSpacing: "-0.02em", color: "var(--ink)" }}>Context Fence</span>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
            </div>
            <p style={{ fontFamily: "DM Mono, monospace", fontWeight: 300, fontSize: "0.72rem", lineHeight: 1.7, color: "var(--ink3)", maxWidth: 320, margin: 0 }}>
              Local DLP for AI agents. Checks what your agent sends out. Nothing leaves your machine.
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: "1.2rem" }}>
              <a href="https://github.com/aditya-ig10/context-fence" target="_blank" rel="noreferrer" style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid var(--rule)", display: "grid", placeItems: "center", color: "var(--ink3)", background: "var(--white)" }} aria-label="GitHub">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.04C6.48 2.04 2 6.36 2 11.7c0 4.26 2.76 7.88 6.6 9.15.48.09.66-.2.66-.45v-1.62c-2.68.58-3.24-1.1-3.24-1.1-.44-1.1-1.08-1.39-1.08-1.39-.88-.6.07-.59.07-.59 1 .07 1.53 1.02 1.53 1.02.87 1.48 2.28 1.05 2.84.8.09-.62.34-1.05.62-1.29-2.14-.24-4.4-1.06-4.4-4.73 0-1.04.38-1.9 1-2.58-.1-.24-.44-1.22.1-2.55 0 0 .83-.27 2.7 1 .79-.2 1.64-.3 2.48-.3.84 0 1.69.1 2.48.3 1.87-1.27 2.7-1 2.7-1 .54 1.33.2 2.31.1 2.55.62.68 1 1.54 1 2.58 0 3.68-2.26 4.48-4.42 4.72.35.3.66.88.66 1.77v2.62c0 .26.18.55.67.45A10.04 10.04 0 0 0 22 11.7C22 6.36 17.52 2.04 12 2.04z" /></svg>
              </a>
              <a href="mailto:hello@synthrun.site" style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid var(--rule)", display: "grid", placeItems: "center", color: "var(--ink3)", background: "var(--white)" }} aria-label="Email">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="M22 6l-10 7L2 6" /></svg>
              </a>
            </div>
          </div>

          <div>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink4)", marginBottom: "1rem", fontWeight: 600 }}>Product</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <li><Link href="/#features" style={{ fontFamily: "DM Mono, monospace", fontSize: "0.72rem", color: "var(--ink3)", textDecoration: "none" }}>Features</Link></li>
              <li><Link href="/how-it-works" style={{ fontFamily: "DM Mono, monospace", fontSize: "0.72rem", color: "var(--ink3)", textDecoration: "none" }}>How it works</Link></li>
              <li><Link href="/#pricing" style={{ fontFamily: "DM Mono, monospace", fontSize: "0.72rem", color: "var(--ink3)", textDecoration: "none" }}>Pricing</Link></li>
              <li><Link href="/downloads" style={{ fontFamily: "DM Mono, monospace", fontSize: "0.72rem", color: "var(--ink3)", textDecoration: "none" }}>Downloads</Link></li>
              <li><Link href="/#faq" style={{ fontFamily: "DM Mono, monospace", fontSize: "0.72rem", color: "var(--ink3)", textDecoration: "none" }}>FAQ</Link></li>
            </ul>
          </div>

          <div>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink4)", marginBottom: "1rem", fontWeight: 600 }}>Company</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <li><Link href="/team" style={{ fontFamily: "DM Mono, monospace", fontSize: "0.72rem", color: "var(--ink3)", textDecoration: "none" }}>Team</Link></li>
              <li><Link href="/blog" style={{ fontFamily: "DM Mono, monospace", fontSize: "0.72rem", color: "var(--ink3)", textDecoration: "none" }}>Blog</Link></li>
              <li><a href="https://cal.com/synthrun/30min" target="_blank" rel="noreferrer" style={{ fontFamily: "DM Mono, monospace", fontSize: "0.72rem", color: "var(--ink3)", textDecoration: "none" }}>Book a call ↗</a></li>
            </ul>
          </div>

          <div>
            <div style={{ fontFamily: "DM Mono, monospace", fontSize: "0.58rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink4)", marginBottom: "1rem", fontWeight: 600 }}>Legal</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <li><Link href="/privacy" style={{ fontFamily: "DM Mono, monospace", fontSize: "0.72rem", color: "var(--ink3)", textDecoration: "none" }}>Privacy</Link></li>
              <li><Link href="/security" style={{ fontFamily: "DM Mono, monospace", fontSize: "0.72rem", color: "var(--ink3)", textDecoration: "none" }}>Security</Link></li>
              <li><Link href="/terms" style={{ fontFamily: "DM Mono, monospace", fontSize: "0.72rem", color: "var(--ink3)", textDecoration: "none" }}>Terms</Link></li>
              <li><CookieSettingsButton /></li>
            </ul>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginTop: "2.5rem", paddingTop: "1.2rem", borderTop: "1px solid var(--rule)", fontFamily: "DM Mono, monospace", fontSize: "0.62rem", color: "var(--ink4)" }}>
          <span>{footer.copy}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981" }} /> Built by Synthrun · Bangalore</span>
        </div>
      </div>
    </footer>
  );
}
