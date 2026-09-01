"use client";

import React from "react";

interface DetailTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    dataKey?: string;
    value?: number | string;
    color?: string;
    stroke?: string;
    fill?: string;
  }>;
  label?: string | number;
  valueFormatter?: (val: number) => string;
}

export default function DetailTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: DetailTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="ad-tooltip">
      {label !== undefined && <p className="ad-tooltip-label">{label}</p>}
      {payload.map((p, i) => {
        const val =
          typeof p.value === "number" && valueFormatter
            ? valueFormatter(p.value)
            : String(p.value ?? "");
        const dotColor = p.color || p.stroke || p.fill || "#2fe6b0";

        return (
          <div key={i} className="ad-tooltip-row">
            <span className="ad-tooltip-dot" style={{ background: dotColor }} />
            <span className="ad-tooltip-name">{p.name || p.dataKey}</span>
            <span className="ad-tooltip-val">{val}</span>
          </div>
        );
      })}
    </div>
  );
}
