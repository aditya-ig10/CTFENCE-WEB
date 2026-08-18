"use client";

// ThanksScene — the thank-you kitty: pops in with a slight roll, then
// idles on a gentle float. Message + button follow in a soft stagger.
// Everything defers to the shared reduced-motion gate; when motion is
// off the scene renders fully visible, static.

import { useEffect, useRef } from "react";
import Link from "next/link";
import { animate as animeAnimate } from "animejs";
import { motionAllowed } from "@/lib/anim";

type ThanksSceneProps = {
  title: string;
  line: string;
  ctaLabel: string;
  ctaHref: string;
};

export default function ThanksScene({ title, line, ctaLabel, ctaHref }: ThanksSceneProps) {
  const floatRef = useRef<HTMLDivElement>(null);
  const kittyRef = useRef<HTMLImageElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const lineRef = useRef<HTMLParagraphElement>(null);
  const btnRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!motionAllowed()) return;
    const float = floatRef.current;
    const kitty = kittyRef.current;
    const titleEl = titleRef.current;
    const lineEl = lineRef.current;
    const btnEl = btnRef.current;
    if (!float || !kitty || !titleEl || !lineEl || !btnEl) return;

    animeAnimate(float, {
      opacity: [0, 1],
      duration: 950,
      ease: "outQuad",
    });
    animeAnimate(kitty, {
      opacity: [0, 1],
      scale: [0.72, 1],
      rotate: [-5, 0],
      duration: 950,
      ease: "outBack(1.6)",
    });
    animeAnimate(titleEl, {
      opacity: [0, 1],
      translateY: [14, 0],
      duration: 600,
      delay: 160,
      ease: "outQuad",
    });
    animeAnimate(lineEl, {
      opacity: [0, 1],
      translateY: [12, 0],
      duration: 600,
      delay: 300,
      ease: "outQuad",
    });
    animeAnimate(btnEl, {
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 600,
      delay: 440,
      ease: "outQuad",
    });

    animeAnimate(float, {
      translateY: ["0%", "-7px", "0%"],
      duration: 2800,
      delay: 1500,
      loop: true,
      ease: "inOutSine",
    });
  }, []);

  return (
    <section className="thanks-scene">
      <div className="ts-float" ref={floatRef}>
        <img
          ref={kittyRef}
          className="thanks-kitty"
          src="/ty/tykitty.png"
          alt="Thank-you kitty — you are all set"
        />
      </div>
      <h1 ref={titleRef} className="thanks-title">
        {title}
      </h1>
      <p ref={lineRef} className="thanks-line">
        {line}
      </p>
      <Link ref={btnRef} href={ctaHref} className="btn-primary">
        {ctaLabel}
      </Link>
    </section>
  );
}