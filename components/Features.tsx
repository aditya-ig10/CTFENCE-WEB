import SplitText from "@/components/SplitText";
import { FeatureIcon } from "@/components/FeatureIcon";
import { features } from "@/content/copy";

export default function Features() {
  return (
    <section className="section" id="features" aria-labelledby="features-title">
      <div className="cap-split">
        <div className="cap-statement">
          <div className="cap-statement-sticky">
            <div className="section-eyebrow">{features.eyebrow}</div>
            <h2 className="cap-statement-title" id="features-title">
              <span>What the proxy checks</span>
              <br />
              <SplitText
                tag="span"
                text="before every call"
                className="cap-statement-accent"
                delay={24}
                duration={0.7}
                ease="power3.out"
                splitType="chars"
                textAlign="left"
              />
            </h2>
            <p className="cap-statement-lead">{features.lead}</p>
            <div className="cap-statement-foot">
              <span className="cap-foot-item">local yaml</span>
              <span className="cap-foot-sep">·</span>
              <span className="cap-foot-item">&lt;10ms</span>
              <span className="cap-foot-sep">·</span>
              <span className="cap-foot-item">sqlite</span>
              <span className="cap-foot-sep">·</span>
              <span className="cap-foot-item">zero egress</span>
            </div>
          </div>
        </div>

        <div className="cap-grid">
          {features.grid.map((f, i) => (
            <article className="cap-cell" key={f.title}>
              <div className="cap-cell-top">
                <span className="cap-num">{String(i + 1).padStart(2, "0")}</span>
                <FeatureIcon name={f.icon} alt={f.alt} />
              </div>
              <h3 className="cap-title">
                {f.title}
                {f.roadmap && <span className="cap-flag">Roadmap</span>}
              </h3>
              <p className="cap-desc">{f.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}