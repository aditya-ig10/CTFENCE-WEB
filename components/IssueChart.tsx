"use client";

import { useEffect, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { animate as animeAnimate } from "animejs";
import { motionAllowed } from "@/lib/anim";
import { issue } from "@/content/copy";
import SplitText from "@/components/SplitText";

gsap.registerPlugin(ScrollTrigger);

const DL_COLOR = "#3b82f6";
const EX_COLOR = "#ff3144";

const fmtM = (v: number) => `${v}M`;
const fmtK = (v: number) => `${v}K`;

type ChartDotProps = {
  cx?: number;
  cy?: number;
  index?: number;
  dataKey?: string;
  payload?: { downloads: number; exposed: number; date: string };
};

function ChartDot({ cx, cy, index, dataKey, payload }: ChartDotProps) {
  if (cx == null || cy == null || payload == null) return null;
  const isLast = index === issue.data.length - 1;
  const isDl = dataKey === "downloads";
  const color = isDl ? DL_COLOR : EX_COLOR;
  return (
    <g>
      {isLast && (
        <circle
          cx={cx}
          cy={cy}
          r={9}
          fill="none"
          stroke={color}
          strokeOpacity={0.35}
          strokeWidth={1.5}
        />
      )}
      <circle
        cx={cx}
        cy={cy}
        r={isLast ? 5 : 3.5}
        fill={color}
        className="issue-point-dot"
      />
      {isLast && (
        <text
          x={cx + 12}
          y={cy + (isDl ? 6 : 32)}
          className="issue-point-label"
          style={{ fill: "var(--text)" }}
        >
          {isDl ? "97M" : "200K"}
        </text>
      )}
    </g>
  );
}

type ChartTooltipProps = {
  active?: boolean;
  payload?: { dataKey?: string; value: number; payload: { name: string; value: number } }[];
  label?: string;
};

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="issue-tooltip">
      <div className="issue-tooltip-label">{label}</div>
      {payload.map((p) => {
        const isDl = p.dataKey === "downloads";
        return (
          <div
            className={`issue-tooltip-row issue-tooltip-row--${isDl ? "dl" : "ex"}`}
            key={p.dataKey}
          >
            <span className="issue-tooltip-dot" aria-hidden="true" />
            <span className="issue-tooltip-name">
              {isDl ? issue.seriesDownloads : issue.seriesExposed}
            </span>
            <span className="issue-tooltip-val">
              {isDl ? fmtM(p.value) : fmtK(p.value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function FindingsTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="issue-tooltip">
      <div className="issue-tooltip-row">
        <span
          className="issue-tooltip-dot"
          style={{ background: EX_COLOR }}
          aria-hidden="true"
        />
        <span className="issue-tooltip-name">{d.name}</span>
        <span className="issue-tooltip-val">{d.value}% of servers</span>
      </div>
    </div>
  );
}

export default function IssueChart() {
  const sectionRef = useRef<HTMLElement>(null);
  const areaRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Per-element scroll reveals + highlights drive the whole section.
  // GSAP handles structure and highlight draws; anime.js handles the
  // elastic flourishes. Motion-gated; reduced-motion / no-JS stay static.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !motionAllowed()) return;

    const ctx = gsap.context(() => {
      const reveal = (
        el: Element | NodeListOf<Element> | null | undefined,
        vars: gsap.TweenVars,
        trigger: Element | null = null
      ) => {
        if (!el) return;
        const trig = trigger ?? (el instanceof Element ? el : el[0]);
        gsap.fromTo(
          el,
          { autoAlpha: 0, ...vars.from },
          { autoAlpha: 1, ...vars.to, scrollTrigger: { trigger: trig, start: "top 80%", once: true } }
        );
      };

      // intro statement rises — eyebrow + lead; the title animates via SplitText
      reveal(
        section.querySelectorAll(
          ".issue-card--intro .section-eyebrow, .issue-card--intro .cap-statement-lead"
        ),
        {
          from: { y: 24 },
          to: { y: 0, duration: 0.7, stagger: 0.09, ease: "power3.out" },
        },
        section.querySelector(".issue-card--intro")
      );

      // ghost numeral pops in behind the title
      reveal(section.querySelector(".issue-ghost"), {
        from: { scale: 1.5, y: -10 },
        to: { scale: 1, y: 0, duration: 1, ease: "power3.out" },
      });

      // masthead furniture — bars and tagline, title animates via SplitText
      reveal(section.querySelectorAll(".issue-press-edition, .issue-press-tagline, .issue-press-date"), {
        from: { y: 14 },
        to: { y: 0, duration: 0.6, stagger: 0.08, ease: "power3.out" },
      });
      reveal(section.querySelector(".issue-press-rule"), {
        from: { scaleX: 0, transformOrigin: "left center" },
        to: { scaleX: 1, duration: 0.9, ease: "power3.inOut" },
      });

      // lead band — article typesets in, photo slides from the right
      const lead = section.querySelector(".issue-press-leadband");
      reveal(
        lead?.querySelectorAll(
          ".issue-press-tag, .issue-press-headline, .issue-press-lede, .issue-press-body > *, .issue-factbox, .issue-press-byline, .issue-read-more"
        ),
        { from: { y: 24 }, to: { y: 0, duration: 0.6, stagger: 0.08, ease: "power3.out" } }
      );
      reveal(lead?.querySelector(".issue-photo--lead"), {
        from: { x: 44 },
        to: { x: 0, duration: 0.85, ease: "power3.out" },
      });
      reveal(lead?.querySelectorAll(".issue-factbox-row"), {
        from: { x: 16 },
        to: { x: 0, duration: 0.45, stagger: 0.05, ease: "power2.out" },
      });

      // briefs flip up like loose pages
      reveal(section.querySelectorAll(".issue-press-brief"), {
        from: { y: 32 },
        to: { y: 0, duration: 0.7, stagger: 0.12, ease: "back.out(1.4)" },
      });

      // feature — article typesets, chart figure rises
      const feature = section.querySelector(".issue-press-feature");
      reveal(
        feature?.querySelectorAll(
          ".issue-press-tag, .issue-press-headline, .issue-press-lede, .issue-press-body > *, .issue-press-byline, .issue-read-more"
        ),
        { from: { y: 24 }, to: { y: 0, duration: 0.6, stagger: 0.08, ease: "power3.out" } }
      );
      reveal(feature?.querySelector(".issue-fig"), {
        from: { y: 34, scale: 0.97 },
        to: { y: 0, scale: 1, duration: 0.8, ease: "power3.out" },
      });
      reveal(feature?.querySelectorAll(".issue-legend-item"), {
        from: { x: 14 },
        to: { x: 0, duration: 0.4, stagger: 0.08, ease: "power2.out" },
      });

      // opinion — article typesets, pullquote springs in (anime.js)
      const opinion = section.querySelector(".issue-press-opinion");
      reveal(
        opinion?.querySelectorAll(
          ".issue-press-tag, .issue-press-headline, .issue-press-lede, .issue-press-body > *, .issue-press-byline, .issue-read-more"
        ),
        { from: { y: 24 }, to: { y: 0, duration: 0.6, stagger: 0.08, ease: "power3.out" } }
      );
      const quote = opinion?.querySelector(".issue-pullquote");
      if (quote) {
        // GSAP only gates visibility; anime owns the transform so the two
        // libraries never fight over the same property.
        gsap.set(quote, { opacity: 0, visibility: "hidden" });
        ScrollTrigger.create({
          trigger: quote,
          start: "top 82%",
          once: true,
          onEnter: () => {
            const player = animeAnimate(quote, {
              opacity: [0, 1],
              scale: [0.86, 1],
              rotate: [-2, 0],
              duration: 900,
              ease: "outElastic(1.2, 0.55)",
            });
            player.then(() => gsap.set(quote, { autoAlpha: 1 }));
          },
        });
      }

      // response — article typesets, spec rows file in from the right
      const response = section.querySelector(".issue-press-response");
      reveal(
        response?.querySelectorAll(
          ".issue-press-tag, .issue-press-headline, .issue-press-lede, .issue-press-body > *, .issue-read-more"
        ),
        { from: { y: 24 }, to: { y: 0, duration: 0.6, stagger: 0.08, ease: "power3.out" } }
      );
      reveal(response?.querySelectorAll(".issue-spec-row"), {
        from: { x: 24 },
        to: { x: 0, duration: 0.5, stagger: 0.07, ease: "power2.out" },
      });

      // ledger — listicle items walk in
      reveal(section.querySelectorAll(".issue-listicle-items > li"), {
        from: { x: -20 },
        to: { x: 0, duration: 0.55, stagger: 0.07, ease: "power3.out" },
      });
      reveal(section.querySelector(".issue-listicle-note"), {
        from: { y: 12 },
        to: { y: 0, duration: 0.5, ease: "power2.out" },
      });
      reveal(section.querySelector(".issue-findings-figure"), {
        from: { y: 34, scale: 0.97 },
        to: { y: 0, scale: 1, duration: 0.8, ease: "power3.out" },
      });

      // scroll highlight — every headline gets an accent rule drawn beneath
      section.querySelectorAll<HTMLElement>(".issue-press-headline").forEach((h) => {
        gsap.fromTo(
          h,
          { backgroundSize: "0% 2px" },
          {
            backgroundSize: "100% 2px",
            duration: 0.9,
            ease: "power3.inOut",
            scrollTrigger: { trigger: h, start: "top 88%", once: true },
          }
        );
      });

      // footer + footnote sign off
      reveal(section.querySelector(".issue-press-footer"), {
        from: { y: 14 },
        to: { y: 0, duration: 0.6, ease: "power3.out" },
      });
      reveal(section.querySelector(".issue-footnote"), {
        from: { y: 16 },
        to: { y: 0, duration: 0.7, ease: "power3.out" },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  const animate = inView && motionAllowed();

  return (
    <section className="section issue" id="issue" aria-label={issue.title} ref={sectionRef}>
      <div className="issue-cards">
        <div className="issue-card issue-card--intro">
          <span className="issue-ghost" aria-hidden="true">
            01
          </span>
          <div className="section-eyebrow">{issue.eyebrow}</div>
          <SplitText
            tag="h2"
            className="cap-statement-title"
            text={issue.title}
            delay={28}
            duration={0.9}
            ease="power4.out"
            from={{ opacity: 0, y: 44 }}
            to={{ opacity: 1, y: 0 }}
            textAlign="left"
            threshold={0.2}
          />
          <p className="cap-statement-lead">{issue.lead}</p>
        </div>

        {/* the evidence — an editorial dossier: masthead, lead photograph,
            briefs, then text → figure → text, and the ledger */}
        <div className="issue-press">
          <div className="issue-press-mast">
            <div className="issue-press-edition">
              <span>{issue.press.edition}</span>
              <span>{issue.press.dateline}</span>
            </div>
            <SplitText
              tag="h3"
              className="issue-press-title"
              text="The Evidence"
              delay={22}
              duration={0.7}
              ease="power4.out"
              from={{ opacity: 0, y: -28, scale: 0.92 }}
              to={{ opacity: 1, y: 0, scale: 1 }}
              threshold={0.2}
            />
            <p className="issue-press-tagline">{issue.press.tagline}</p>
            <div className="issue-press-date">
              <span>{issue.press.date.range}</span>
              <span>{issue.press.date.price}</span>
            </div>
          </div>
          <div className="issue-press-rule" aria-hidden="true" />

          <div className="issue-press-row issue-press-leadband">
            <article className="issue-press-article issue-press-article--lead">
              <p className="issue-press-tag">{issue.press.lead.kicker}</p>
              <h4 className="issue-press-headline">{issue.press.lead.title}</h4>
              <p className="issue-press-lede">{issue.press.lead.lede}</p>
              <div className="issue-press-body">
                {issue.press.lead.body.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
              <aside className="issue-factbox">
                <p className="issue-factbox-title">{issue.press.factbox.title}</p>
                <dl className="issue-factbox-rows">
                  {issue.press.factbox.rows.map((r) => (
                    <div className="issue-factbox-row" key={r.label}>
                      <dt>{r.label}</dt>
                      <dd>{r.value}</dd>
                    </div>
                  ))}
                </dl>
              </aside>
              <p className="issue-press-byline">{issue.press.lead.byline}</p>
              <p className="issue-read-more">
                <a href={issue.press.lead.source.href} target="_blank" rel="noopener noreferrer">
                  read more ↗
                </a>
              </p>
            </article>
            <figure className="issue-photo issue-photo--lead">
              <img
                src={issue.press.photoLead.src}
                alt="Rows of server racks in a dimly lit datacenter aisle"
                loading="lazy"
              />
              <figcaption>
                <span className="issue-photo-cap">{issue.press.photoLead.caption}</span>
                <span className="issue-photo-credit">{issue.press.photoLead.credit}</span>
              </figcaption>
            </figure>
          </div>

          <div className="issue-press-row issue-press-briefs">
            {issue.press.briefs.map((b) => (
              <article className="issue-press-brief" key={b.title}>
                <figure className="issue-photo issue-photo--brief">
                  <img src={b.src} alt={b.caption} loading="lazy" />
                  <figcaption className="issue-photo-cap">{b.caption}</figcaption>
                </figure>
                <p className="issue-press-tag">{b.kicker}</p>
                <h4 className="issue-press-headline">{b.title}</h4>
                <p className="issue-press-lede">{b.lede}</p>
                {b.body && <p className="issue-press-body">{b.body}</p>}
                <p className="issue-read-more">
                  <a href={b.source.href} target="_blank" rel="noopener noreferrer">
                    read more ↗
                  </a>
                </p>
              </article>
            ))}
          </div>

          <div className="issue-press-row issue-press-feature">
            <article className="issue-press-article">
              <p className="issue-press-tag">{issue.press.feature.kicker}</p>
              <h4 className="issue-press-headline">{issue.press.feature.title}</h4>
              <p className="issue-press-lede">{issue.press.feature.lede}</p>
              <div className="issue-press-body">
                <p>{issue.press.feature.body[0]}</p>
                <h5 className="issue-crosshead">{issue.press.feature.crosshead}</h5>
                <p>{issue.press.feature.body[1]}</p>
              </div>
              <p className="issue-press-byline">{issue.press.feature.byline}</p>
              <p className="issue-read-more">
                <a
                  href={issue.press.feature.source.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  read more ↗
                </a>
              </p>
            </article>

            <figure className="issue-fig" ref={areaRef}>
              <figcaption className="issue-fig-cap">
                <span className="issue-fig-cap-dot" aria-hidden="true" />
                {issue.press.fig1.label}
              </figcaption>
              <div className="issue-card-head">
                <p className="issue-card-sub">
                  {issue.seriesDownloads} vs {issue.seriesExposed}
                </p>
                <p className="issue-card-range">{issue.press.fig1.range}</p>
              </div>
              <div className="issue-chart" data-animate={animate ? "1" : "0"}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    key={animate ? "animated" : "static"}
                    data={issue.data}
                    margin={{ top: 24, right: 12, bottom: 4, left: 4 }}
                  >
                    <defs>
                      <linearGradient id="issue-dl-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={DL_COLOR} stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.04} />
                      </linearGradient>
                      <linearGradient id="issue-ex-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={EX_COLOR} stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#f472b6" stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tickMargin={10}
                      padding={{ left: 8, right: 44 }}
                    />
                    <YAxis
                      yAxisId="m"
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                      tickFormatter={fmtM}
                      axisLine={false}
                      tickLine={false}
                      width={46}
                    />
                    <YAxis
                      yAxisId="k"
                      orientation="right"
                      domain={[0, 200]}
                      ticks={[0, 50, 100, 150, 200]}
                      tickFormatter={fmtK}
                      axisLine={false}
                      tickLine={false}
                      width={48}
                    />
                    <Tooltip
                      content={<ChartTooltip />}
                      cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                    />
                    <Area
                      yAxisId="m"
                      dataKey="downloads"
                      type="monotone"
                      stroke={DL_COLOR}
                      strokeWidth={2}
                      fill="url(#issue-dl-fill)"
                      dot={<ChartDot />}
                      activeDot={{ r: 4 }}
                      isAnimationActive={animate}
                      animationDuration={1100}
                      animationEasing="ease-out"
                    />
                    <Area
                      yAxisId="k"
                      dataKey="exposed"
                      type="monotone"
                      stroke={EX_COLOR}
                      strokeWidth={2}
                      strokeDasharray="6 4"
                      fill="url(#issue-ex-fill)"
                      dot={<ChartDot />}
                      activeDot={{ r: 4 }}
                      isAnimationActive={animate}
                      animationDuration={1100}
                      animationEasing="ease-out"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="issue-legend">
                <span className="issue-legend-item">
                  <span className="issue-legend-dot issue-legend-dot--dl" aria-hidden="true" />
                  {issue.seriesDownloads}
                  <span className="issue-legend-delta">10M → 97M</span>
                </span>
                <span className="issue-legend-item">
                  <span className="issue-legend-dot issue-legend-dot--ex" aria-hidden="true" />
                  {issue.seriesExposed}
                  <span className="issue-legend-delta">60K → 200K</span>
                </span>
              </div>
            </figure>
          </div>

          <div className="issue-press-row issue-press-opinion">
            <article className="issue-press-article issue-press-article--op">
              <p className="issue-press-tag">{issue.press.analysis.kicker}</p>
              <h4 className="issue-press-headline">{issue.press.analysis.title}</h4>
              <p className="issue-press-lede">{issue.press.analysis.lede}</p>
              <div className="issue-press-body">
                {issue.press.analysis.body.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
              <p className="issue-press-byline">{issue.press.analysis.byline}</p>
              <p className="issue-read-more">
                <a
                  href={issue.press.analysis.source.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  read more ↗
                </a>
              </p>
            </article>
            <aside className="issue-pullquote">
              <span className="issue-pullquote-mark" aria-hidden="true">“</span>
              <p>{issue.press.analysis.quote}</p>
            </aside>
          </div>

          <div className="issue-press-row issue-press-response">
            <article className="issue-press-article issue-press-article--resp">
              <p className="issue-press-tag">{issue.press.response.kicker}</p>
              <h4 className="issue-press-headline">{issue.press.response.title}</h4>
              <p className="issue-press-lede">{issue.press.response.lede}</p>
              <div className="issue-press-body">
                {issue.press.response.body.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
              <p className="issue-read-more">
                <a href={issue.press.response.cta.href}>
                  {issue.press.response.cta.label} ↗
                </a>
              </p>
            </article>

            <aside className="issue-spec">
              <p className="issue-spec-title">the fence at a glance</p>
              <dl className="issue-spec-rows">
                {issue.press.response.spec.map((r) => (
                  <div className="issue-spec-row" key={r.label}>
                    <dt>{r.label}</dt>
                    <dd>{r.value}</dd>
                  </div>
                ))}
              </dl>
            </aside>
          </div>

          <div className="issue-press-row issue-press-ledger">
            <article className="issue-listicle">
              <p className="issue-press-tag">{issue.press.listicle.kicker}</p>
              <ol className="issue-listicle-items">
                {issue.press.listicle.items.map((it, i) => (
                  <li key={it}>
                    <span className="issue-listicle-num">{String(i + 1).padStart(2, "0")}</span>
                    <span className="issue-listicle-text">{it}</span>
                  </li>
                ))}
              </ol>
              <p className="issue-listicle-note">{issue.press.listicle.note}</p>
            </article>

            <figure className="issue-fig">
              <figcaption className="issue-fig-cap">
                <span className="issue-fig-cap-dot" aria-hidden="true" />
                {issue.press.fig2.label} · {issue.findings.range}
              </figcaption>
              <div className="issue-card-head">
                <p className="issue-card-sub">{issue.findings.title}</p>
              </div>
              <div className="issue-findings-figure">
                <div className="issue-findings-chart" data-animate={animate ? "1" : "0"}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      key={animate ? "findings-animated" : "findings-static"}
                      data={issue.findings.data}
                      margin={{ top: 28, right: 8, bottom: 4, left: 4 }}
                      barCategoryGap="30%"
                    >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tickMargin={10}
                      tick={{
                        fill: "var(--muted)",
                        fontSize: 9.5,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    />
                    <YAxis
                      domain={[0, 8]}
                      ticks={[0, 2, 4, 6, 8]}
                      tickFormatter={(v: number) => `${v}%`}
                      axisLine={false}
                      tickLine={false}
                      width={34}
                    />
                    <Tooltip
                      content={<FindingsTooltip />}
                      cursor={{ fill: "var(--border)", fillOpacity: 0.25 }}
                    />
                      <Bar
                        dataKey="value"
                        fill={EX_COLOR}
                        radius={[5, 5, 0, 0]}
                        barSize={32}
                        isAnimationActive={animate}
                        animationDuration={900}
                        animationEasing="ease-out"
                      >
                        <LabelList
                          dataKey="value"
                          position="top"
                          formatter={(v: string | number | boolean | null | undefined) => `${v ?? ""}%`}
                          offset={8}
                          style={{
                            fill: "var(--text)",
                            fontSize: 11,
                            fontWeight: 600,
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <p className="issue-findings-note">{issue.findings.note}</p>
            </figure>
          </div>

          <footer className="issue-press-footer">
            <span>{issue.press.index}</span>
            <span className="issue-press-endmark" aria-hidden="true">
              - 30 -
            </span>
          </footer>
        </div>
      </div>

      <p className="issue-footnote">{issue.footnote}</p>
    </section>
  );
}