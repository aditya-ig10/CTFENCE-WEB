"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { motionAllowed } from "@/lib/anim";
import { nav } from "@/content/copy";

// appears only after hero leaves the viewport, mobile only
export default function StickyCta() {
  const barRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(min-width: 768px)").matches) return;
    const heroEl = document.getElementById("hero-top");
    if (!heroEl) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        setVisible(entry.isIntersecting === false);
      },
      { rootMargin: "0px 0px -15% 0px" }
    );
    io.observe(heroEl);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    if (visible) {
      bar.style.display = "block";
      if (motionAllowed()) {
        gsap.fromTo(bar, { y: 32, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, ease: "power2.out" });
      }
    } else {
      bar.style.display = "none";
    }
  }, [visible]);

  return (
    <div className="sticky-cta" ref={barRef} aria-hidden={!visible}>
      <Link href={nav.cta.href} className="btn-primary">
        {nav.cta.label}
      </Link>
    </div>
  );
}