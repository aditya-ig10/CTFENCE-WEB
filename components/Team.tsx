import Image from "next/image";
import { team } from "@/content/copy";

export default function Team() {
  return (
    <section className="section" id="team" aria-labelledby="team-title">
      <div className="section-eyebrow">{team.eyebrow}</div>
      <h2 className="section-title" id="team-title">{team.title}</h2>
      <p className="section-lead">{team.lead}</p>
      <div className="team-grid">
        {team.members.map((m) => (
          <article className="team-card" key={m.name}>
            <figure className="team-photo-wrap">
              <Image
                className="team-photo"
                src={m.photo}
                alt={m.alt}
                width={96}
                height={96}
                sizes="96px"
              />
            </figure>
            <h3 className="team-name">{m.name}</h3>
            <p className="team-role">{m.role}</p>
            <p className="team-bio">{m.bio}</p>
          </article>
        ))}
      </div>
    </section>
  );
}