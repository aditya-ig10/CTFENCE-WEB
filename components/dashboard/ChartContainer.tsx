"use client";

import React from "react";
import TimeRangeSelector, { TimeRange } from "./TimeRangeSelector";

interface ChartContainerProps {
  title: string;
  subtitle?: string;
  timeRange?: TimeRange;
  ranges?: TimeRange[];
  onTimeRangeChange?: (r: TimeRange) => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
  height?: number | string;
  className?: string;
}

export default function ChartContainer({
  title,
  subtitle,
  timeRange,
  ranges,
  onTimeRangeChange,
  actions,
  children,
  height = 280,
  className = "",
}: ChartContainerProps) {
  return (
    <div className={`dash-chart-card ${className}`}>
      <div className="ad-card-head">
        <div>
          <h3 className="ad-h3">{title}</h3>
          {subtitle && <p className="ad-h3-sub">{subtitle}</p>}
        </div>

        <div className="dash-chart-actions">
          {timeRange && onTimeRangeChange && (
            <TimeRangeSelector
              value={timeRange}
              ranges={ranges}
              onChange={onTimeRangeChange}
            />
          )}
          {actions}
        </div>
      </div>

      <div className="ad-chart-body" style={{ height, width: "100%", marginTop: 12 }}>
        {children}
      </div>
    </div>
  );
}
