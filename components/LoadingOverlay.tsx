"use client";

import { useEffect, useState } from "react";
import { motionAllowed } from "@/lib/anim";

export default function LoadingOverlay() {
  const [phase, setPhase] = useState<"on" | "off" | "gone">("on");

  useEffect(() => {
    if (!motionAllowed()) {
      setPhase("gone");
      return;
    }
    const hide = setTimeout(() => setPhase("off"), 800);
    const remove = setTimeout(() => setPhase("gone"), 1400);
    return () => {
      clearTimeout(hide);
      clearTimeout(remove);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      className={`loading-overlay${phase === "off" ? " loading-overlay--off" : ""}`}
      aria-hidden="true"
    >
      <div className="loader">
        <span>
          <span />
          <span />
          <span />
          <span />
        </span>
        <div className="base">
          <span />
          <div className="face" />
        </div>
      </div>
      <div className="longfazers">
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}