"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Shield,
  GitBranch,
  CheckSquare,
  Users,
  History,
  FileCheck,
  Cpu,
  RotateCcw,
  Sparkles,
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const TEAMS_NAV = [
  { href: "/dashboard/fleet", label: "Fleet Health", icon: Activity },
  { href: "/dashboard/siem", label: "SIEM Streaming", icon: Shield },
  { href: "/dashboard/policy-code", label: "Policy as Code", icon: GitBranch },
  { href: "/dashboard/approvals", label: "Change Approvals", icon: CheckSquare },
];

const ENTERPRISE_NAV = [
  { href: "/dashboard/rbac", label: "SSO & RBAC", icon: Users },
  { href: "/dashboard/policy-versions", label: "Version Control", icon: History },
  { href: "/dashboard/compliance", label: "Compliance Packs", icon: FileCheck },
  { href: "/dashboard/sandbox", label: "Custom Sandbox", icon: Cpu },
  { href: "/dashboard/incident-replay", label: "Incident Replay", icon: RotateCcw },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="dash-container">
      {/* Sub-navigation bar */}
      <nav className="dash-nav" aria-label="Feature sections">
        <div className="dash-nav-group">
          <span className="dash-nav-badge dash-badge-teams">Teams Tier</span>
          {TEAMS_NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`dash-nav-item ${active ? "active" : ""}`}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="dash-nav-divider" />

        <div className="dash-nav-group">
          <span className="dash-nav-badge dash-badge-enterprise">
            <Sparkles size={11} /> Enterprise
          </span>
          {ENTERPRISE_NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`dash-nav-item ${active ? "active" : ""}`}
              >
                <Icon size={14} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Page Area */}
      <div className="dash-content">{children}</div>

      <style>{`
.dash-container {
  width: 100%;
  max-width: 1380px;
  margin: 0 auto;
  padding: 24px 20px 60px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.dash-nav {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--card-bg, #0d0d12);
  border: 1px solid var(--border-default, #1e1e2e);
  border-radius: 18px;
  overflow-x: auto;
  white-space: nowrap;
  box-shadow: 0 4px 20px rgba(0,0,0,0.25);
}
.dash-nav-group {
  display: flex;
  align-items: center;
  gap: 6px;
}
.dash-nav-badge {
  font-size: 10px;
  font-weight: 750;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 6px;
  margin-right: 4px;
}
.dash-badge-teams {
  background: rgba(57, 126, 112, 0.15);
  color: #2fe6b0;
  border: 1px solid rgba(57, 126, 112, 0.3);
}
.dash-badge-enterprise {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 49, 68, 0.12);
  color: #ff4d5e;
  border: 1px solid rgba(255, 49, 68, 0.3);
}
.dash-nav-divider {
  width: 1px;
  height: 20px;
  background: var(--border-default, #1e1e2e);
  margin: 0 6px;
}
.dash-nav-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted, #8484a6);
  padding: 6px 12px;
  border-radius: 10px;
  text-decoration: none;
  transition: all 0.15s ease;
}
.dash-nav-item:hover {
  color: var(--text-primary, #e8e8f0);
  background: var(--bg-inset, rgba(255,255,255,0.03));
}
.dash-nav-item.active {
  color: var(--text-primary, #e8e8f0);
  background: var(--bg-inset, rgba(255,255,255,0.08));
  border: 1px solid var(--border-strong, rgba(255,255,255,0.15));
}
.dash-content {
  width: 100%;
}
      `}</style>
    </div>
  );
}
