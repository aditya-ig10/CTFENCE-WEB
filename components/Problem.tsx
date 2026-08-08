import { problem } from "@/content/copy";

export default function Problem() {
  return (
    <section className="section tight" id="why" aria-labelledby="why-title">
      <div className="section-eyebrow">{problem.eyebrow}</div>
      <h2 className="section-title" id="why-title">{problem.title}</h2>
      <div className="prose-body" style={{ maxWidth: 680 }}>
        {problem.body.map((p) => (
          <p key={p.slice(0, 32)}>{p}</p>
        ))}
      </div>
    </section>
  );
}