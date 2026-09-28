import SplitText from "@/components/SplitText";
import { FeatureIcon } from "@/components/FeatureIcon";
import { RevealGroup } from "@/components/Reveal";
import { features } from "@/content/copy";

export default function Features() {
  return (
    <section className="section" id="features" aria-labelledby="features-title">
      <div className="cap-split">
        <div className="cap-statement">
          <div className="cap-statement-sticky">
            <div className="section-eyebrow">{features.eyebrow}</div>
            <h2 className="cap-statement-title" id="features-title">
              <span>What Context Fence</span>
              <br />
              <SplitText
                tag="span"
                text="protects"
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

        <RevealGroup className="cap-grid">
          {features.grid.map((f, i) => (
            <article className="cap-cell" key={f.title}>
              <div className="cap-cell-top">
                <span className="cap-num">{String(i + 1).padStart(2, "0")}</span>
                <FeatureIcon name={f.icon} alt={f.alt} />
              </div>
              <h3 className="cap-title">
                {f.title}
                {f.roadmap && <span className="cap-flag">Roadmap</span>}
                {f.tag && <span className="cap-flag">{f.tag}</span>}
              </h3>
            <p className="cap-desc">{f.desc}</p>
          </article>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}