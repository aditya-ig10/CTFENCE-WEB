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
import { motionAllowed } from "@/lib/anim";
import { issue } from "@/content/copy";

gsap.registerPlugin(ScrollTrigger);

const DL_COLOR = "#3b82f6";
const EX_COLOR = "#ff3144";

const fmtM = (v: number) => `${v}M`;
const fmtK = (v: number) => `${v}K`;

function ChartDot({ cx, cy, index, dataKey, payload }: any) {
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
        stroke="var(--void)"
        strokeWidth={1.5}
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

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="issue-tooltip">
      <div className="issue-tooltip-label">{label}</div>
      {payload.map((p: any) => {
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

function FindingsTooltip({ active, payload }: any) {
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
  const areaRef = useRef<HTMLDivElement>(null);
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

  // One scrubbed timeline drives the whole section: intro → charts → evidence.
  // Reversible, motion-gated; reduced-motion / no-JS stay statically visible.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !motionAllowed()) return;

    const ctx = gsap.context(() => {
      const intro = section.querySelector<HTMLElement>(".issue-card--intro");
      const area = section.querySelector<HTMLElement>(".issue-card--area");
      const findings = section.querySelector<HTMLElement>(".issue-card--findings");
      const press = section.querySelector<HTMLElement>(".issue-press");
      const articles = section.querySelectorAll(".issue-press-article");
      if (!intro || !area || !findings || !press) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top 72%",
          end: "top 8%",
          scrub: 0.5,
        },
      });

      tl.fromTo(
        intro.querySelectorAll(".section-eyebrow, .cap-statement-title"),
        { y: 28, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.2, ease: "power2.out", stagger: 0.05 },
        0
      );
      tl.fromTo(
        intro.querySelector(".cap-statement-lead"),
        { y: 24, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.18, ease: "power2.out" },
        0.1
      );
      tl.fromTo(
        area,
        { y: 40, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.26, ease: "power2.out" },
        0.22
      );
      tl.fromTo(
        findings,
        { y: 40, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.26, ease: "power2.out" },
        0.3
      );
      tl.fromTo(
        press,
        { y: 32, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.2, ease: "power2.out" },
        0.5
      );
      tl.fromTo(
        articles,
        { y: 24, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.2, ease: "power2.out", stagger: 0.06 },
        0.58
      );
    }, section);

    return () => ctx.revert();
  }, []);

  const animate = inView && motionAllowed();

  return (
    <section className="section issue" id="issue" aria-labelledby="issue-title" ref={sectionRef}>
      <div className="issue-cards">
        <div className="issue-card issue-card--intro">
          <div className="section-eyebrow">{issue.eyebrow}</div>
          <h2 className="cap-statement-title" id="issue-title">
            {issue.title}
          </h2>
          <p className="cap-statement-lead">{issue.lead}</p>
        </div>

        <div className="issue-cards-row">
          <div className="issue-card issue-card--area" ref={areaRef}>
            <div className="issue-card-head">
              <p className="issue-card-sub">{issue.seriesDownloads} vs {issue.seriesExposed}</p>
              <p className="issue-card-range">nov 2024 → mar 2026</p>
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
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
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
          </div>

          <div className="issue-card issue-card--findings">
            <div className="issue-card-head">
              <p className="issue-card-sub">{issue.findings.title}</p>
              <p className="issue-card-range">{issue.findings.range}</p>
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
                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
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
                        formatter={(v: any) => `${v}%`}
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
          </div>
        </div>

        <div className="issue-press">
          <p className="issue-press-kicker">{issue.press.eyebrow}</p>
          <header className="issue-press-masthead">
            <h3 className="issue-press-title">The Evidence</h3>
            <p className="issue-press-dateline">{issue.press.dateline}</p>
          </header>
          <div className="issue-press-grid">
            {issue.press.articles.map((a) => (
              <a
                className={
                  "issue-press-article" + (a.featured ? " issue-press-article--lead" : "")
                }
                href={a.href}
                target="_blank"
                rel="noopener noreferrer"
                key={a.href}
              >
                <p className="issue-press-tag">{a.kicker}</p>
                <h4 className="issue-press-headline">{a.title}</h4>
                <p className="issue-press-lede">{a.lede}</p>
                <p className="issue-press-byline">{a.byline}</p>
              </a>
            ))}
          </div>
          <footer className="issue-press-footer">
            <span>{issue.press.index}</span>
            <span>each study linked in full · opens in a new tab</span>
          </footer>
        </div>
      </div>

      <p className="issue-footnote">{issue.footnote}</p>
    </section>
  );
}
