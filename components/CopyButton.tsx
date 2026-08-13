"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import { motionAllowed } from "@/lib/anim";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const handle = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }
    setCopied(true);
    const btn = ref.current;
    if (btn && motionAllowed()) {
      animate(btn, {
        scale: [0.94, 1],
        duration: 300,
        ease: "outBack",
      });
    }
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1700);
  };

  return (
    <button
      ref={ref}
      type="button"
      className={`download-copy${copied ? " is-copied" : ""}`}
      aria-label="Copy to clipboard"
      onClick={handle}
    >
      {copied ? "copied ✓" : "copy"}
    </button>
  );
}
