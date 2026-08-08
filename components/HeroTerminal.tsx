"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { hero } from "@/content/copy";
import { motionAllowed } from "@/lib/anim";

gsap.registerPlugin(useGSAP);

export default function HeroTerminal() {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!motionAllowed()) return;
      const lines = rootRef.current?.querySelectorAll<HTMLElement>(".t-line");
      if (!lines?.length) return;
      const ctx = gsap.context(() => {
        gsap.set(lines, { opacity: 0, y: 4 });
        gsap.to(lines, {
          opacity: 1,
          y: 0,
          duration: 0.18,
          stagger: 0.16,
          ease: "power1.out",
          delay: 1.0,
        });
      }, rootRef);
      return () => ctx.revert();
    },
    { scope: rootRef }
  );

  // terminal lines are rendered SSR-visible; gsap.set hides them only when motion is on
  return (
    <div className="terminal-wrap" ref={rootRef}>
      <div className="terminal-bar">
        <div className="tbar-dot" />
        <div className="tbar-dot" />
        <div className="tbar-dot" />
        <span className="tbar-title">{hero.terminal.title}</span>
      </div>
      <div className="terminal-body" role="img" aria-label="Example session: Context Fence blocks an agent from reading .env and passing values to a GitHub MCP tool">
        {hero.terminal.lines.map((l, i) => (
          <div className="t-line" key={i}>
            {l.prompt && <span className="t-prompt">{l.prompt}</span>}
            {l.at && <span className="t-output">{l.at}</span>}
            {l.tild && <span className="t-prompt">{l.tild}</span>}
            {l.cmd && <span className="t-cmd"> {l.cmd}</span>}
            {l.out && <span className="t-output">{l.out}</span>}
            {l.key && <span className="t-key">{l.key}</span>}
            {l.val && <span className="t-val">{l.val}</span>}
            {l.blocked && <span className="t-blocked">{l.blocked}</span>}
            {l.cursor && <span className="cursor" aria-hidden="true" />}
          </div>
        ))}
      </div>
    </div>
  );
}