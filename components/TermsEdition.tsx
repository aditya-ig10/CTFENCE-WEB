"use client";

import { Fragment, useEffect, useRef } from "react";
import gsap from "gsap";
import { motionAllowed } from "@/lib/anim";
import { terms } from "@/content/copy";
import NewspaperMasthead from "@/components/NewspaperMasthead";

const ADS = [
  {
    head: "If the fence says no, it means no.",
    body: "Blocked calls get logged with a reason. The audit trail is append-only, local, and yours.",
    cta: "Read the field notes",
    href: "/evidence",
    solid: false,
  },
  {
    head: "Local by default. Cloud by accident only.",
    body: "Zero telemetry in the default configuration. Nothing leaves the machine unless you say so.",
    cta: "Check the checksums",
    href: "/downloads",
    solid: true,
  },
  {
    head: "The penny press of agent policy.",
    body: "Schema checks in under ten milliseconds. Small print, set in lead, set once.",
    cta: "See the docs",
    href: "/docs",
    solid: false,
  },
];

function AdBlock({ ad }: { ad: (typeof ADS)[number] }) {
  return (
    <aside className={`paper-ad${ad.solid ? " paper-ad--solid" : ""}`}>
      <div className="paper-ad-head">{ad.head}</div>
      <p className="paper-ad-body">{ad.body}</p>
      <a className="paper-ad-cta" href={ad.href}>
        {ad.cta}
        <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M1 6h10M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </a>
    </aside>
  );
}

export default function TermsEdition() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !motionAllowed()) return;

    const ctx = gsap.context(() => {
      // the strap banner wipes in under the masthead
      gsap.fromTo(
        root.querySelector(".paper-banner"),
        { clipPath: "inset(0 100% 0 0)" },
        {
          clipPath: "inset(0 0% 0 0)",
          duration: 1.1,
          ease: "power4.inOut",
          scrollTrigger: { trigger: ".paper-banner", start: "top 92%", once: true },
        }
      );

      // headline words set in, one at a time
      gsap.fromTo(
        root.querySelectorAll(".paper-headline .paper-word"),
        { y: 26, autoAlpha: 0 },
        {
          y: 0,
          autoAlpha: 1,
          duration: 0.7,
          stagger: 0.05,
          ease: "power3.out",
          scrollTrigger: { trigger: ".paper-headline", start: "top 88%", once: true },
        }
      );

      // clauses rise, § numbers pop, plain-speak slides in
      gsap.utils.toArray<HTMLElement>(".paper-clause").forEach((clause) => {
        gsap.fromTo(
          clause,
          { autoAlpha: 0, y: 22 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
            ease: "expo.out",
            scrollTrigger: { trigger: clause, start: "top 90%", once: true },
          }
        );
        gsap.fromTo(
          clause.querySelector(".paper-clause-no"),
          { autoAlpha: 0, x: -6 },
          {
            autoAlpha: 1,
            x: 0,
            duration: 0.4,
            ease: "power2.out",
            scrollTrigger: { trigger: clause, start: "top 88%", once: true },
          }
        );
        gsap.fromTo(
          clause.querySelector(".paper-clause-plain"),
          { autoAlpha: 0, y: 10 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.55,
            ease: "power3.out",
            scrollTrigger: { trigger: clause, start: "top 84%", once: true },
          }
        );
      });

      // ad boxes drop in with a little bounce
      gsap.utils.toArray<HTMLElement>(".paper-ad").forEach((ad, i) => {
        gsap.fromTo(
          ad,
          { autoAlpha: 0, y: 18, scale: 0.97 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.65,
            ease: "back.out(1.7)",
            delay: 0.12 + i * 0.1,
            scrollTrigger: { trigger: ad, start: "top 90%", once: true },
          }
        );
      });

      // the witness block — signature lines draw themselves
      gsap.fromTo(
        root.querySelectorAll(".paper-witness > *"),
        { autoAlpha: 0, y: 14 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.55,
          stagger: 0.09,
          ease: "power3.out",
          scrollTrigger: { trigger: ".paper-witness", start: "top 90%", once: true },
        }
      );
      gsap.fromTo(
        root.querySelectorAll(".paper-signature-line"),
        { scaleX: 0 },
        {
          scaleX: 1,
          transformOrigin: "left center",
          duration: 0.7,
          stagger: 0.15,
          ease: "power3.inOut",
          scrollTrigger: { trigger: ".paper-witness", start: "top 86%", once: true },
        }
      );
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section className="paper-page paper-page--void" id="terms" ref={rootRef}>
      <NewspaperMasthead
        variant="legal"
        barLeft="contract corner"
        barRight="august 16, 2026"
        nameplate="The Contract Corner"
        tagline={terms.sub}
      />

      <div className="paper-banner" role="presentation">
        <div className="paper-banner-title">
          Read the fine print <em>before your agent does.</em>
        </div>
        <div className="paper-banner-sub">
          local edition · printed at the fence
          <br />
          <span className="paper-banner-price">50¢</span> · {terms.sections.length} clauses · 0
          warranties
        </div>
      </div>

      <article className="paper-spread">
        <header className="paper-head paper-head--center">
          <div className="paper-kicker">{terms.eyebrow}</div>
          <h1 className="paper-headline" id="terms-title">
            {terms.title.split(" ").map((w, i) => (
              <span className="paper-word" key={i}>
                {w}
                {i < terms.title.split(" ").length - 1 ? "\u00A0" : ""}
              </span>
            ))}
          </h1>
          <p className="paper-lede">{terms.sub}</p>
          <div className="paper-byline">{terms.updated}</div>
        </header>

        <div className="paper-spread-cols">
          {terms.sections.map((s, i) => (
            <Fragment key={s.h}>
              <section className="paper-clause">
                <div className="paper-clause-head">
                  <span className="paper-clause-no" aria-hidden="true">
                    § {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 className="paper-clause-h">{s.h}</h2>
                </div>
                <p className="paper-clause-legal">{s.legal}</p>
                <div className="paper-clause-plain">
                  <span className="paper-clause-plain-label">{terms.modeLabel.plain}</span>
                  <p>{s.plain}</p>
                </div>
              </section>
              {i === 1 && <AdBlock ad={ADS[0]} />}
              {i === 6 && <AdBlock ad={ADS[1]} />}
              {i === 10 && <AdBlock ad={ADS[2]} />}
            </Fragment>
          ))}
        </div>

        <footer className="paper-witness">
          <div className="paper-witness-rule" aria-hidden="true" />
          <p>
            IN WITNESS WHEREOF, the parties have caused these terms to be printed in the
            Sunday edition of The Context Fence, on the twenty-second day of the month of
            August, in the year two thousand and twenty-six.
          </p>
          <div className="paper-signatures">
            <div className="paper-signature">
              <span className="paper-signature-line" aria-hidden="true" />
              <span>for Synthrun</span>
            </div>
            <div className="paper-signature">
              <span className="paper-signature-line" aria-hidden="true" />
              <span>for the fence</span>
            </div>
          </div>
        </footer>
      </article>
    </section>
  );
}