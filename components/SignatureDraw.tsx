"use client";

import { useEffect, useRef, useState } from "react";
import { motion, type Variants } from "framer-motion";

type SignatureDrawProps = {
  label: string;
  viewBox: string;
  paths: string[];
};

const draw: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 1.5, ease: "easeInOut" },
  },
};

const container: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.35, delayChildren: 0.15 },
  },
};

const ink = { stroke: "var(--ink)", fill: "transparent" };

// fail-open signature: always renders a static, visible signature. when the
// block first scrolls into view the observer remounts a motion.svg (fresh
// mount so initial="hidden" applies), the paths draw themselves in once, and
// the observer disconnects — the drawn signature stays as is from then on.
export default function SignatureDraw({ label, viewBox, paths }: SignatureDrawProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [draws, setDraws] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setDraws((d) => d + 1);
            io.disconnect();
          }
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {draws > 0 ? (
        <motion.svg
          key={draws}
          className="paper-signature-svg"
          viewBox={viewBox}
          preserveAspectRatio="xMidYMax meet"
          role="img"
          aria-label={`${label} signature`}
          variants={container}
          initial="hidden"
          animate="visible"
        >
          {paths.map((d, i) => (
            <motion.path
              key={i}
              d={d}
              variants={draw}
              style={ink}
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </motion.svg>
      ) : (
        <svg
          className="paper-signature-svg"
          viewBox={viewBox}
          preserveAspectRatio="xMidYMax meet"
          role="img"
          aria-label={`${label} signature`}
          style={ink}
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {paths.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </svg>
      )}
    </div>
  );
}