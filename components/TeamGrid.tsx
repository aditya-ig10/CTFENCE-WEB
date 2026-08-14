"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { motionAllowed } from "@/lib/anim";
import { team } from "@/content/copy";
import NewspaperMasthead from "@/components/NewspaperMasthead";

function ThemedImage({ dark, light, alt }: { dark: string; light: string; alt: string }) {
  const [src, setSrc] = useState(dark);

  useEffect(() => {
    const pick = () => {
      const t = document.documentElement.getAttribute("data-theme");
      setSrc(t === "light" ? light : dark);
    };
    pick();
    const mo = new MutationObserver(pick);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => mo.disconnect();
  }, [dark, light]);

  return <img src={src} alt={alt} loading="lazy" />;
}

export default function TeamGrid() {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !motionAllowed()) return;

    const ctx = gsap.context(() => {
      // the lead headline — word by word off the press
      gsap.fromTo(
        root.querySelectorAll(".paper-headline .paper-word"),
        { autoAlpha: 0, y: 18 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.055,
          ease: "power3.out",
          scrollTrigger: { trigger: ".paper-head", start: "top 84%", once: true },
        }
      );
      gsap.fromTo(
        root.querySelectorAll(".paper-kicker, .paper-byline"),
        { autoAlpha: 0, y: 12 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: { trigger: ".paper-head", start: "top 88%", once: true },
        }
      );

      // the lead — ink wipes down the paragraph
      gsap.fromTo(
        ".paper-lead",
        { autoAlpha: 0, clipPath: "inset(0 0 100% 0)" },
        {
          autoAlpha: 1,
          clipPath: "inset(0 0 0% 0)",
          duration: 0.9,
          ease: "expo.out",
          scrollTrigger: { trigger: ".paper-lead", start: "top 88%", once: true },
        }
      );

      // founder columns — each one rises, press photo wipes in, caption rules
      // draw under the frame
      gsap.utils.toArray<HTMLElement>(".paper-column").forEach((col) => {
        gsap.fromTo(
          col,
          { autoAlpha: 0, y: 42 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.8,
            ease: "expo.out",
            scrollTrigger: { trigger: col, start: "top 85%", once: true },
          }
        );
        gsap.fromTo(
          col.querySelector(".paper-press-photo"),
          { clipPath: "inset(100% 0 0 0)" },
          {
            clipPath: "inset(0% 0 0 0)",
            duration: 0.9,
            ease: "expo.inOut",
            scrollTrigger: { trigger: col, start: "top 80%", once: true },
          }
        );
        gsap.fromTo(
          col.querySelectorAll(".paper-col-headline, .paper-col-meta, .paper-col-body"),
          { autoAlpha: 0, y: 14 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.55,
            stagger: 0.07,
            ease: "power3.out",
            scrollTrigger: { trigger: col, start: "top 78%", once: true },
          }
        );
        gsap.fromTo(
          col.querySelector(".paper-quote"),
          { autoAlpha: 0, y: 18 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
            ease: "power3.out",
            scrollTrigger: { trigger: col.querySelector(".paper-quote"), start: "top 90%", once: true },
          }
        );
        gsap.fromTo(
          col.querySelector(".paper-quote-mark"),
          { scale: 0.3, rotate: -14 },
          {
            scale: 1,
            rotate: 0,
            duration: 0.6,
            ease: "back.out(1.8)",
            scrollTrigger: { trigger: col.querySelector(".paper-quote"), start: "top 90%", once: true },
          }
        );
      });

      // the board — three portraits stagger in, names letter-spaced in
      gsap.utils.toArray<HTMLElement>(".paper-board-card").forEach((card) => {
        gsap.fromTo(
          card,
          { autoAlpha: 0, y: 32 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.7,
            ease: "expo.out",
            scrollTrigger: { trigger: ".paper-board-grid", start: "top 85%", once: true },
          }
        );
      });
      gsap.fromTo(
        root.querySelectorAll(".paper-board-head > *"),
        { autoAlpha: 0, y: 14 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: ".paper-board", start: "top 88%", once: true },
        }
      );

      // classifieds — the small print runs in, the sale card keeps the accent
      gsap.utils.toArray<HTMLElement>(".paper-classified").forEach((card) => {
        gsap.fromTo(
          card,
          { autoAlpha: 0, y: 20 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: { trigger: ".paper-classifieds-grid", start: "top 88%", once: true },
          }
        );
      });
      gsap.fromTo(
        root.querySelectorAll(".paper-classifieds .paper-kicker, .paper-classifieds .paper-section-rule"),
        { autoAlpha: 0 },
        {
          autoAlpha: 1,
          duration: 0.5,
          ease: "power3.out",
          scrollTrigger: { trigger: ".paper-classifieds", start: "top 92%", once: true },
        }
      );
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section className="paper-page paper-page--void paper-team" id="team" aria-labelledby="paper-team-title" ref={rootRef}>
      <NewspaperMasthead
        variant="front"
        barLeft={team.barLeft}
        barMid={team.barMid}
        barRight={team.barRight}
        nameplate={team.nameplate}
        tagline={team.tagline}
        ticker={team.ticker}
      />

      <article className="paper-article">
        <header className="paper-head">
          <div className="paper-kicker">{team.kicker}</div>
          <h1 className="paper-headline" id="paper-team-title">
            {team.headline.split(" ").map((w, i) => (
              <span className="paper-word" key={i}>
                {w}
                {i < team.headline.split(" ").length - 1 ? "\u00A0" : ""}
              </span>
            ))}
          </h1>
          <div className="paper-byline">{team.byline}</div>
        </header>
        <p className="paper-lead">{team.lead}</p>
      </article>

      <div className="paper-founder-row">
        {team.founders.map((f) => (
          <article className="paper-column" key={f.name}>
            <figure className="paper-press-photo">
              <ThemedImage dark={f.photo.dark} light={f.photo.light} alt={`${f.name} — ${f.role}`} />
              <figcaption className="paper-caption">{f.caption}</figcaption>
            </figure>
            <h2 className="paper-col-headline">{f.headline}</h2>
            <p className="paper-col-meta">
              {f.name} — {f.role} · {f.tagline}
            </p>
            <p className="paper-col-body">{f.bio}</p>
            <blockquote className="paper-quote">
              <span className="paper-quote-mark" aria-hidden="true">
                “
              </span>
              <p>{f.quote}</p>
            </blockquote>
          </article>
        ))}
      </div>

      <section className="paper-board" aria-label={team.boardEyebrow}>
        <header className="paper-board-head">
          <div className="paper-kicker">{team.boardEyebrow}</div>
          <p className="paper-board-lead">{team.boardLead}</p>
        </header>
        <div className="paper-board-grid">
          {team.crew.map((m) => (
            <figure className="paper-board-card" key={m.name}>
              <div className="paper-board-photo">
                <ThemedImage dark={m.photo.dark} light={m.photo.light} alt={`${m.name} — ${m.role}`} />
              </div>
              <figcaption className="paper-board-caption">
                <span className="paper-board-name">{m.name}</span>
                <span className="paper-board-role">{m.role}</span>
                <span className="paper-board-blurb">{m.blurb}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="paper-classifieds" aria-label="Classifieds">
        <div className="paper-section-rule" aria-hidden="true" />
        <div className="paper-kicker">classifieds</div>
        <div className="paper-classifieds-grid">
          {team.classifieds.map((c) =>
            c.cta ? (
              <Link key={c.tag} href={c.cta.href} className="paper-classified paper-classified--cta">
                <span className="paper-classified-tag">{c.tag}</span>
                <span className="paper-classified-text">{c.text}</span>
                <span className="paper-classified-link">
                  {c.cta.label}
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 7h8M8 3.5 11.5 7 8 10.5" />
                  </svg>
                </span>
              </Link>
            ) : (
              <div className="paper-classified" key={c.tag}>
                <span className="paper-classified-tag">{c.tag}</span>
                <span className="paper-classified-text">{c.text}</span>
              </div>
            )
          )}
        </div>
      </section>
    </section>
  );
}