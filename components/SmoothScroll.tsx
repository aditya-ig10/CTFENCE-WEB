"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { motionAllowed } from "@/lib/anim";

gsap.registerPlugin(ScrollTrigger);

// one scroll driver for the whole site:
// lenis inertia wheel, scroll progress bar, section reveals, hero parallax.
// respects prefers-reduced-motion via lib/anim.
export default function SmoothScroll() {
  const barRef = useRef<HTMLDivElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();
  // pathnames visited this session — distinguishes a fresh page from a
  // back/forward return, so new pages open at the top while previously
  // loaded pages keep their scroll position.
  const visitedRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!motionAllowed()) return;

    const lenis = new Lenis({ lerp: 0.07, wheelMultiplier: 1.0 });
    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    function onAnchorClick(e: MouseEvent) {
      const a = (e.target as HTMLElement).closest?.(
        'a[href]'
      ) as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href")!;
      const id = href.startsWith("/#")
        ? href.slice(2)
        : href.startsWith("#")
          ? href.slice(1)
          : null;
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { duration: 1.4 });
    }
    document.addEventListener("click", onAnchorClick);

    const ctx = gsap.context(() => {
      // reading progress bar
      if (barRef.current) {
        gsap.fromTo(
          barRef.current,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: "none",
            scrollTrigger: { start: 0, end: "max", scrub: 0.25 },
          }
        );
      }

      // section headers + standalone blocks rise in
      gsap.utils
        .toArray<HTMLElement>(
          ".section-eyebrow, .section-title, .section-lead, .footer, .prose-page h1, .prose-page .updated, .blog-hero, .ticker, .mail-cta"
        )
        .forEach((el) => {
          gsap.fromTo(
            el,
            { y: 28, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.8,
              ease: "power3.out",
              scrollTrigger: { trigger: el, start: "top 88%" },
            }
          );
        });

      // card grids + lists stagger in
      gsap.utils
        .toArray<HTMLElement>(
          ".cap-grid, .plans, .stats, .signup-form, .prose-body, .thanks-box, .replay-scenes, .draft-grid, .acc-list"
        )
        .forEach((group) => {
          gsap.fromTo(
            group.children,
            { y: 44, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.7,
              stagger: 0.09,
              ease: "power3.out",
              scrollTrigger: { trigger: group, start: "top 85%" },
            }
          );
        });

      // hero terminal lags behind the page as you scroll away (404 page only)
      if (document.querySelector(".terminal-wrap")) {
        gsap.to(".terminal-wrap", {
          y: 64,
          ease: "none",
          scrollTrigger: { trigger: "body", start: "top top", end: "max", scrub: 0.4 },
        });
      }
    });

    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);

    return () => {
      document.removeEventListener("click", onAnchorClick);
      window.removeEventListener("load", onLoad);
      gsap.ticker.remove(raf);
      ctx.revert();
      lenisRef.current = null;
      lenis.destroy();
    };
  }, []);

  // scroll policy on route change: fresh pages start at the top; pages the
  // browser already has scroll state for (back/forward returns) keep it.
  useEffect(() => {
    if (!motionAllowed() || typeof window === "undefined") return;
    if (visitedRef.current === null) {
      visitedRef.current = new Set([pathname]);
      return;
    }
    if (visitedRef.current.has(pathname)) {
      requestAnimationFrame(() => {
        lenisRef.current?.scrollTo(window.scrollY, { immediate: true });
      });
    } else {
      visitedRef.current.add(pathname);
      lenisRef.current?.scrollTo(0, { immediate: true });
    }
  }, [pathname]);

  return <div ref={barRef} className="scroll-progress" aria-hidden="true" />;
}