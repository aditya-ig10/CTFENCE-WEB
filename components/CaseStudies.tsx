import { cases } from "@/content/copy";

export default function CaseStudies() {
  return (
    <section className="section case-files" id="cases" aria-labelledby="cases-title">
      <div className="case-files-intro">
        <div className="section-eyebrow">{cases.eyebrow}</div>
        <h2 className="cap-statement-title" id="cases-title">
          {cases.title}
        </h2>
        <p className="cap-statement-lead">{cases.lead}</p>
      </div>

      <div className="pc-row">
        {cases.cards.map((card, i) => (
          <article className="pc-card" key={card.id}>
            <div className="pc-inner">
              <span className="pc-num" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="pc-top">
                <span className="pc-badge">{String(i + 1).padStart(2, "0")}</span>
                <span className="pc-file">file · {card.file}</span>
                <span className="pc-status">
                  <span className="pc-status-dot" aria-hidden="true" />
                  {card.status}
                </span>
              </div>
              <h3 className="pc-title">{card.title}</h3>
              <p className="pc-role">{card.role}</p>
              <div className="pc-stages">
                {card.stages.map((s) => (
                  <div className={`pc-stage pc-stage--${s.tone}`} key={s.label}>
                    <span className="pc-stage-dot" aria-hidden="true" />
                    <div className="pc-stage-copy">
                      <span className="pc-stage-label">{s.label}</span>
                      <p className="pc-stage-text">{s.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pc-signals">
                {card.signals.map((sig) => (
                  <span className="pc-signal" key={sig}>
                    {sig}
                  </span>
                ))}
              </div>
              <span className="pc-power" aria-hidden="true" />
            </div>
          </article>
        ))}
      </div>

      <p className="cases-footnote">{cases.footnote}</p>
    </section>
  );
}
