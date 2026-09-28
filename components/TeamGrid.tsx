"use client";

import { Reveal, RevealGroup } from "@/components/Reveal";
import { team } from "@/content/copy";

export default function TeamGrid() {
  return (
    <div className="team">
      <Reveal>
      <header className="team-head">
        <div className="team-eyebrow"><span className="team-dot" />the team</div>
        <h1 className="team-title">The people behind the fence.</h1>
        <p className="team-sub">Two founders and three builders. Everyone below ships.</p>
      </header>
      </Reveal>

      <RevealGroup className="team-founders">
        {team.founders.map((f) => (
          <article key={f.name} className="team-card team-card--founder">
            <div className="team-info">
              <div className="team-name">{f.name}</div>
              <div className="team-role">{f.role} · {f.tagline}</div>
              <p className="team-bio">{f.bio}</p>
              <p className="team-quote">“{f.quote}”</p>
            </div>
          </article>
        ))}
      </RevealGroup>

      <RevealGroup className="team-crew">
        {team.crew.map((m) => (
          <article key={m.name} className="team-card">
            <div className="team-info">
              <div className="team-name team-name--sm">{m.name}</div>
              <div className="team-role">{m.role}</div>
              <p className="team-bio">{m.blurb}</p>
            </div>
          </article>
        ))}
      </RevealGroup>
    </div>
  );
}
