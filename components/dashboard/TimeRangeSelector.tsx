"use client";

import React from "react";

export type TimeRange = "6h" | "24h" | "48h" | "7d" | "30d";

interface TimeRangeSelectorProps {
  ranges?: TimeRange[];
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

const DEFAULT_RANGES: TimeRange[] = ["6h", "24h", "7d"];

export default function TimeRangeSelector({
  ranges = DEFAULT_RANGES,
  value,
  onChange,
}: TimeRangeSelectorProps) {
  const formatLabel = (r: TimeRange) => {
    switch (r) {
      case "6h":
        return "6h";
      case "24h":
        return "24h";
      case "48h":
        return "48h";
      case "7d":
        return "7 Days";
      case "30d":
        return "30 Days";
      default:
        return r;
    }
  };

  return (
    <div className="ad-range" role="group" aria-label="Time range selector">
      {ranges.map((r) => (
        <button
          key={r}
          type="button"
          className={`ad-range-btn ${value === r ? "active" : ""}`}
          onClick={() => onChange(r)}
        >
          {formatLabel(r)}
        </button>
      ))}
    </div>
  );
}
