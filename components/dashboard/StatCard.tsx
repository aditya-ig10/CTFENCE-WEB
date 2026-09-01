"use client";

import React from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  variant?: "teal" | "orange" | "white";
  delta?: string;
  deltaDirection?: "up" | "down" | "neutral";
  progress?: number;
  className?: string;
}

export default function StatCard({
  label,
  value,
  unit,
  sub,
  variant = "white",
  delta,
  deltaDirection = "neutral",
  progress,
  className = "",
}: StatCardProps) {
  const variantClass =
    variant === "teal"
      ? "dash-kpi-teal"
      : variant === "orange"
      ? "dash-kpi-orange"
      : "dash-kpi-white";

  return (
    <div className={`dash-kpi-card ${variantClass} ${className}`}>
      <div className="dash-kpi-top">
        <p className="dash-kpi-label">{label}</p>
        {delta && (
          <span className={`dash-delta-badge dash-delta-${deltaDirection}`}>
            {deltaDirection === "up" && <ArrowUpRight size={12} />}
            {deltaDirection === "down" && <ArrowDownRight size={12} />}
            {deltaDirection === "neutral" && <Minus size={12} />}
            <span>{delta}</span>
          </span>
        )}
      </div>

      <div className="dash-kpi-val-row">
        <p className="dash-kpi-value">
          {value}
          {unit && <span className="dash-kpi-unit">{unit}</span>}
        </p>
      </div>

      {typeof progress === "number" && (
        <div className="dash-meter">
          <div
            className="dash-meter-fill"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}

      {sub && <p className="dash-kpi-sub">{sub}</p>}
    </div>
  );
}
