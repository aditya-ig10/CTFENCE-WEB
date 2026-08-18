"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { motionAllowed } from "@/lib/anim";
import { privacy } from "@/content/copy";
import NewspaperMasthead from "@/components/NewspaperMasthead";

export default function PrivacyEdition() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !motionAllowed()) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        root.querySelectorAll(".ledger-head > *"),
        { autoAlpha: 0, y: 12 },
        { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power3.out" }
      );

      gsap.fromTo(
        root.querySelectorAll(".ledger-tldr > *"),
        { autoAlpha: 0, y: 14 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.06,
          ease: "power3.out",
          scrollTrigger: { trigger: ".ledger-tldr", start: "top 88%", once: true },
        }
      );

      gsap.fromTo(
        root.querySelectorAll(".ledger-row"),
        { autoAlpha: 0, y: 16 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.55,
          stagger: 0.07,
          ease: "power3.out",
          scrollTrigger: { trigger: ".ledger-rows", start: "top 88%", once: true },
        }
      );

      gsap.fromTo(
        root.querySelectorAll(".mode-plate"),
        { autoAlpha: 0, y: 18 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.55,
          stagger: 0.09,
          ease: "power3.out",
          scrollTrigger: { trigger: ".ledger-modes", start: "top 88%", once: true },
        }
      );

      gsap.fromTo(
        root.querySelectorAll(".ledger-contact > *"),
        { autoAlpha: 0, y: 14 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.55,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: ".ledger-contact", start: "top 90%", once: true },
        }
      );
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section className="paper-page paper-page--void" id="privacy" ref={rootRef}>
      <NewspaperMasthead
        variant="legal"
        barLeft="confidential — do not redact"
        barRight="august 16, 2026"
        nameplate="The Privacy Ledger"
        tagline={privacy.sub}
      />

      <article className="ledger">
        <header className="ledger-head">
          <div className="paper-kicker">{privacy.eyebrow}</div>
          <h1 className="paper-headline" id="privacy-title">
            {privacy.title.split(" ").map((w, i) => (
              <span className="paper-word" key={i}>
                {w}
                {i < privacy.title.split(" ").length - 1 ? "\u00A0" : ""}
              </span>
            ))}
          </h1>
          <p className="paper-lede">{privacy.sub}</p>
          <div className="paper-byline">{privacy.updated}</div>
        </header>

        <div className="ledger-tldr" aria-label="At a glance">
          {privacy.tldr.map((t) => (
            <div className="ledger-tldr-box" key={t}>
              {t}
            </div>
          ))}
        </div>

        <div className="ledger-rows">
          <div className="ledger-row">
            <div className="ledger-row-label">
              <span className="ledger-row-no" aria-hidden="true">
                § 00
              </span>
              {privacy.who.h}
            </div>
            <div className="ledger-row-body">{privacy.who.p}</div>
          </div>

          {privacy.sections.map((s, i) => (
            <div className="ledger-row" key={s.h}>
              <div className="ledger-row-label">
                <span className="ledger-row-no" aria-hidden="true">
                  § {String(i + 1).padStart(2, "0")}
                </span>
                {s.h}
              </div>
              {s.p && <div className="ledger-row-body">{s.p}</div>}
              {s.items && (
                <ul className="ledger-list">
                  {s.items.map((it) => (
                    <li key={it}>
                      <span className="ledger-dash" aria-hidden="true">
                        —
                      </span>
                      {it}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <div className="ledger-modes">
          <div className="ledger-modes-head">
            <div className="ledger-row-label">
              <span className="ledger-row-no" aria-hidden="true">
                § flow
              </span>
              {privacy.flow.h}
            </div>
            <p className="ledger-modes-sub">{privacy.flow.p}</p>
          </div>
          <div className="ledger-modes-grid">
            {privacy.flow.modes.map((m, i) => (
              <div className="mode-plate" key={m.id}>
                <span className="mode-plate-no" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="mode-plate-label">{m.label}</span>
                <span className="mode-plate-note">{m.note}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ledger-contact">
          <div>
            <h2 className="ledger-contact-h">{privacy.contact.h}</h2>
            <p className="ledger-contact-p">{privacy.contact.p}</p>
          </div>
          <Link href={privacy.contact.cta.href} className="ledger-contact-cta">
            {privacy.contact.cta.label}
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 7h8M8 3.5 11.5 7 8 10.5" />
            </svg>
          </Link>
        </div>

        <footer className="ledger-colophon">
          <div className="ledger-colophon-rule" aria-hidden="true" />
          <p>
            This ledger first ran August 16, 2026, in The Privacy Ledger edition of Context
            Fence. It is subject to revision — the date at the top of the page is the notice.
          </p>
        </footer>
      </article>
    </section>
  );
}
