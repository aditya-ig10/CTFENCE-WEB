import Link from "next/link";
import { notFound } from "@/content/copy";
import { baseMetadata } from "@/lib/seo";

export const metadata = baseMetadata({
  title: "Not found",
  description: "cf: route not found [404]",
  path: "/404",
});

export default function NotFound() {
  return (
    <main className="terminal-page">
      <img
        className="notfound-kitty"
        src="/404/404kitty.png"
        alt="404 kitty — the page you wanted is not here"
      />
      <div className="terminal-wrap">
        <div className="terminal-bar">
          <div className="tbar-dot" />
          <div className="tbar-dot" />
          <div className="tbar-dot" />
          <span className="tbar-title">context-fence — 404</span>
        </div>
        <div className="terminal-body">
          <p>
            <span className="t-prompt">{notFound.prompt}</span>
            <span className="t-output">@local</span>
            <span className="t-prompt">~</span> <span className="t-cmd">cd {`${"/"}missing${"/"}`}page</span>
          </p>
          <p className="t-blocked">{notFound.title}</p>
          <p className="t-output">{notFound.body}</p>
          <p style={{ marginTop: 16 }}>
            <Link href="/" className="btn-primary">
              {notFound.cta.label}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}