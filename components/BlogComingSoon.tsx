"use client";

import { useEffect, useState, type FormEvent } from "react";
import { blog } from "@/content/copy";
import { motionAllowed } from "@/lib/anim";

function Tape({ n }: { n: number }) {
  return <span className={`draft-tape draft-tape-${n}`} aria-hidden="true" />;
}

export default function BlogComingSoon() {
  const [line, setLine] = useState(0);
  const [chars, setChars] = useState(0);
  const [phase, setPhase] = useState<"idle" | "swapping" | "done">("idle");

  const typed = blog.typed[line] ?? "";
  const typing = chars < typed.length;

  useEffect(() => {
    if (!motionAllowed()) {
      setChars(typed.length);
      return;
    }
    if (typing) {
      const t = setTimeout(() => setChars((c) => c + 1), 24);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setLine((l) => (l + 1) % blog.typed.length);
      setChars(0);
    }, 2600);
    return () => clearTimeout(t);
  }, [chars, line, typing]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (phase !== "idle") return;
    setPhase("swapping");
    setTimeout(() => setPhase("done"), 240);
  }

  return (
    <main className="blog-page">
      <section className="blog-hero">
        <div className="section-eyebrow">{blog.eyebrow}</div>
        <div className="blog-coming" role="status">
          <span className="blog-coming-dot" aria-hidden="true" />
          {blog.comingSoon}
        </div>
        <h1 className="blog-title">{blog.title}</h1>
        <p className="blog-sub">{blog.sub}</p>
        <div className="blog-typewriter" aria-live="polite">
          <span className="blog-typed">{typed.slice(0, chars)}</span>
          <span className="blog-caret" aria-hidden="true" />
        </div>
      </section>

      <section className="draft-board" aria-label="Planned posts">
        <div className="section-eyebrow">{blog.draftsEyebrow}</div>
        <div className="draft-grid">
          {blog.drafts.map((d, i) => (
            <article key={d.no} className={`draft-card draft-card-${i + 1}`}>
              <Tape n={i + 1} />
              <div className="draft-no">{d.no}</div>
              <h2 className="draft-title">{d.title}</h2>
              <p className="draft-blurb">{d.blurb}</p>
              <div className="draft-status">
                <span className="draft-status-dot" aria-hidden="true" />
                {d.status}
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {[0, 1].map((copy) => (
            <span key={copy} className="ticker-run">
              {blog.ticker.map((t) => (
                <span key={t} className="ticker-item">
                  {t}
                  <span className="ticker-sep">✦</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <section className="mail-cta">
        <div className="section-eyebrow">{blog.mailEyebrow}</div>
        <h2 className="mail-title">{blog.mailTitle}</h2>
        <div className={`mail-box ${phase !== "idle" ? "swapping" : ""}`}>
          <div className="mail-box-inner">
            {phase === "done" ? (
              <p className="mail-done" role="status">
                {blog.mailDone}
              </p>
            ) : (
              <form className="mail-form" onSubmit={onSubmit}>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder={blog.mailPlaceholder}
                  aria-label="Email address"
                  className="mail-input"
                />
                <button type="submit" className="mail-button">
                  {blog.mailCta}
                </button>
              </form>
            )}
          </div>
        </div>
        <p className="mail-note">{blog.mailNote}</p>
      </section>
    </main>
  );
}