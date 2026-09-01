"use client";

import React from "react";

export function StatCardSkeleton() {
  return (
    <div className="dash-kpi-card dash-kpi-white dash-skeleton-card">
      <div className="dash-skeleton-line" style={{ width: "40%", height: 14 }} />
      <div className="dash-skeleton-line" style={{ width: "65%", height: 32, margin: "14px 0 8px" }} />
      <div className="dash-skeleton-line" style={{ width: "80%", height: 12 }} />
    </div>
  );
}

export function ChartSkeleton({ height = 280 }: { height?: number | string }) {
  return (
    <div className="dash-chart-card dash-skeleton-card">
      <div className="dash-skeleton-line" style={{ width: "35%", height: 18 }} />
      <div className="dash-skeleton-line" style={{ width: "55%", height: 12, marginTop: 6 }} />
      <div
        className="dash-skeleton-block"
        style={{ width: "100%", height, marginTop: 18, borderRadius: 12 }}
      />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="dash-chart-card dash-skeleton-card">
      <div className="dash-skeleton-line" style={{ width: "25%", height: 18 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="dash-skeleton-line" style={{ width: "100%", height: 36, borderRadius: 8 }} />
        ))}
      </div>
    </div>
  );
}
