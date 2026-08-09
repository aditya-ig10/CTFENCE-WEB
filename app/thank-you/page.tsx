import Link from "next/link";
import { thankYou } from "@/content/copy";
import { baseMetadata } from "@/lib/seo";

export const metadata = baseMetadata({
  title: "Thank you",
  description: "Early access request received. We reply within 4 business hours.",
  path: "/thank-you",
});

export default function ThankYouPage() {
  return (
    <main className="prose-page">
      <div className="section-eyebrow">{thankYou.eyebrow}</div>
      <h1 style={{ marginBottom: 8 }}>{thankYou.title}</h1>
      <div className="thanks-box">
        <p>
          <span className="t-prompt">cf</span>
          <span className="t-output">@queue</span>
          <span className="t-prompt">~</span> <span className="t-cmd">status --request</span>
        </p>
        <p className="t-output">
          request queued. reply within <span className="t-ok">4 business hours</span>.
        </p>
      </div>
      <div className="prose-body">
        {thankYou.body.map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
        <p style={{ display: "flex", gap: 12, marginTop: 32 }}>
          <Link href={thankYou.homeCta.href} className="btn-ghost">
            {thankYou.homeCta.label}
          </Link>
          <Link href={thankYou.docsCta.href} className="btn-primary">
            {thankYou.docsCta.label}
          </Link>
        </p>
      </div>
    </main>
  );
}