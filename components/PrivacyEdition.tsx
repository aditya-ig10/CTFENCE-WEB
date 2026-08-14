"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { motionAllowed } from "@/lib/anim";
import { privacy } from "@/content/copy";
import NewspaperMasthead, { PaperStamp } from "@/components/NewspaperMasthead";

export default function PrivacyEdition() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !motionAllowed()) return;

    const ctx = gsap.context(() => {
      // notice headers rule in, bodies follow — small print rises
      gsap.utils.toArray<HTMLElement>(".paper-notice").forEach((notice) => {
        gsap.fromTo(
          notice.querySelector(".paper-notice-h"),
          { autoAlpha: 0, y: 12 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.5,
            ease: "power3.out",
            scrollTrigger: { trigger: notice, start: "top 86%", once: true },
          }
        );
        gsap.fromTo(
          notice.querySelector(".paper-notice-rule"),
          { scaleX: 0 },
          {
            scaleX: 1,
            transformOrigin: "left center",
            duration: 0.6,
            ease: "power3.inOut",
            scrollTrigger: { trigger: notice, start: "top 86%", once: true },
          }
        );
        gsap.fromTo(
          notice.querySelectorAll(".paper-notice-p, .paper-notice-list > *"),
          { autoAlpha: 0, y: 14 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.05,
            ease: "power3.out",
            scrollTrigger: { trigger: notice, start: "top 82%", once: true },
          }
        );
      });

      // the three modes — classified boxes run in
      gsap.utils.toArray<HTMLElement>(".paper-mode").forEach((mode) => {
        gsap.fromTo(
          mode,
          { autoAlpha: 0, y: 18 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.08,
            ease: "power3.out",
            scrollTrigger: { trigger: ".paper-modes", start: "top 88%", once: true },
          }
        );
      });

      // contact block + colophon
      gsap.fromTo(
        root.querySelectorAll(".paper-contact > *, .paper-colophon > *"),
        { autoAlpha: 0, y: 14 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.55,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: ".paper-contact", start: "top 88%", once: true },
        }
      );

      // the stamp — hits the page last
      gsap.fromTo(
        root.querySelector(".paper-stamp"),
        { scale: 1.9, rotate: -16, autoAlpha: 0 },
        {
          scale: 1,
          rotate: -6,
          autoAlpha: 1,
          duration: 0.55,
          ease: "power3.out",
          scrollTrigger: { trigger: ".paper-stamp", start: "top 88%", once: true },
        }
      );
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section className="paper-page paper-legal" id="privacy" ref={rootRef}>
      <NewspaperMasthead
        variant="legal"
        barLeft="legal notices section"
        barRight="august 16, 2026"
        nameplate="The Fine Print"
        tagline={privacy.sub}
      />

      <article className="paper-notices">
        <header className="paper-head paper-head--center">
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

        <section className="paper-notice">
          <h2 className="paper-notice-h">{privacy.who.h}</h2>
          <span className="paper-notice-rule" aria-hidden="true" />
          <p className="paper-notice-p">{privacy.who.p}</p>
        </section>

        <section className="paper-notice">
          <h2 className="paper-notice-h">{privacy.flow.h}</h2>
          <span className="paper-notice-rule" aria-hidden="true" />
          <p className="paper-notice-p">{privacy.flow.p}</p>
          <div className="paper-modes">
            {privacy.flow.modes.map((m) => (
              <div className="paper-mode" key={m.id}>
                <span className="paper-mode-label">{m.label}</span>
                <span className="paper-mode-note">{m.note}</span>
              </div>
            ))}
          </div>
        </section>

        {privacy.sections.map((s, i) => (
          <section className={`paper-notice${i % 2 ? " paper-notice--cols" : ""}`} key={s.h}>
            <h2 className="paper-notice-h">{s.h}</h2>
            <span className="paper-notice-rule" aria-hidden="true" />
            {s.p && <p className="paper-notice-p">{s.p}</p>}
            {s.items && (
              <ul className="paper-notice-list">
                {s.items.map((it) => (
                  <li key={it}>
                    <span className="paper-dash" aria-hidden="true">
                      —
                    </span>
                    {it}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <div className="paper-contact">
          <h2 className="paper-notice-h">{privacy.contact.h}</h2>
          <p className="paper-notice-p">{privacy.contact.p}</p>
          <Link href={privacy.contact.cta.href} className="paper-contact-cta">
            {privacy.contact.cta.label}
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 7h8M8 3.5 11.5 7 8 10.5" />
            </svg>
          </Link>
        </div>

        <footer className="paper-colophon">
          <div className="paper-colophon-rule" aria-hidden="true" />
          <p>
            This notice first ran August 16, 2026, in The Context Fence. It is subject to
            revision — the date at the top of the page is the notice.
          </p>
          <PaperStamp />
        </footer>
      </article>
    </section>
  );
}