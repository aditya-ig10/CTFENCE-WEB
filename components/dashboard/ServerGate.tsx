import React from "react";
import Link from "next/link";
import { Shield, Lock, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import type { PlanId } from "@/lib/entitlements";

interface ServerGateProps {
  featureName: string;
  featureDesc: string;
  requiredPlan: PlanId;
  actualPlan?: PlanId;
  capabilities: string[];
  children?: React.ReactNode;
  isEntitled: boolean;
}

export default function ServerGate({
  featureName,
  featureDesc,
  requiredPlan,
  actualPlan = "free",
  capabilities,
  children,
  isEntitled,
}: ServerGateProps) {
  if (isEntitled) {
    return <>{children}</>;
  }

  const planBadge = requiredPlan.toUpperCase();
  const checkoutHref =
    requiredPlan === "enterprise"
      ? "mailto:hello@synthrun.site?subject=Enterprise%20Inquiry%20-%20Context%20Fence"
      : `/checkout?plan=${requiredPlan}`;

  return (
    <div className="ag2-card gate-locked-card">
      <div className="gate-locked-inner">
        <div className="gate-locked-badge">
          <Lock size={14} className="gate-lock-icon" />
          <span>{planBadge} TIER REQUIRED</span>
        </div>

        <h2 className="gate-locked-title">{featureName}</h2>
        <p className="gate-locked-desc">{featureDesc}</p>

        <div className="gate-specs-box">
          <div className="gate-specs-head">
            <Sparkles size={14} className="gate-sparkle" />
            <span>Enterprise Feature Capabilities</span>
          </div>

          <div className="gate-specs-grid">
            {capabilities.map((cap, i) => (
              <div key={i} className="gate-spec-item">
                <CheckCircle2 size={13} className="gate-check" />
                <span>{cap}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="gate-actions-row">
          <Link href={checkoutHref} className="prof-btn-action prof-btn-nodes gate-upgrade-btn">
            <Shield size={14} />
            <span>Upgrade to {planBadge} Plan</span>
            <ArrowRight size={14} />
          </Link>

          <Link href="/#pricing" className="gate-compare-link">
            Compare all tier limits →
          </Link>
        </div>

        <div className="gate-footer-note">
          <span>Current active tier: <strong>{actualPlan.toUpperCase()}</strong>. Enforcement gates re-verified server-side.</span>
        </div>
      </div>

      <style>{`
.gate-locked-card {
  padding: 44px 36px;
  background: linear-gradient(180deg, var(--card-bg) 0%, rgba(13, 13, 18, 0.95) 100%);
  border: 1px solid rgba(255, 49, 68, 0.25);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  text-align: center;
  max-width: 820px;
  margin: 20px auto;
  border-radius: 28px;
}
.gate-locked-inner { display: flex; flex-direction: column; align-items: center; }
.gate-locked-badge {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 750; letter-spacing: 0.06em;
  padding: 4px 12px; border-radius: 999px;
  background: rgba(255, 49, 68, 0.12); color: #ff4d5e;
  border: 1px solid rgba(255, 49, 68, 0.3); margin-bottom: 16px;
}
.gate-locked-title {
  font-size: 28px; font-weight: 700; letter-spacing: -0.02em;
  color: var(--text-primary, #e8e8f0); margin: 0 0 8px; line-height: 1.2;
}
.gate-locked-desc {
  font-size: 14px; line-height: 1.6; color: var(--text-muted, #8484a6);
  max-width: 600px; margin: 0 0 24px;
}
.gate-specs-box {
  width: 100%; max-width: 660px;
  background: var(--bg-inset, rgba(255,255,255,0.02));
  border: 1px solid var(--border-default, #1e1e2e);
  border-radius: 18px; padding: 20px; text-align: left;
  margin-bottom: 28px;
}
.gate-specs-head {
  display: flex; align-items: center; gap: 7px;
  font-size: 12px; font-weight: 700; color: var(--text-secondary, #c4c4d4);
  text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 12px;
}
.gate-sparkle { color: #ffb020; }
.gate-specs-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px 16px;
}
@media (max-width: 640px) { .gate-specs-grid { grid-template-columns: 1fr; } }
.gate-spec-item {
  display: flex; align-items: center; gap: 8px;
  font-size: 12.5px; color: var(--text-muted, #8484a6);
}
.gate-check { color: #2fe6b0; flex-shrink: 0; }
.gate-actions-row {
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap; justify-content: center;
}
.gate-upgrade-btn {
  font-size: 13.5px; padding: 11px 24px; font-weight: 700;
}
.gate-compare-link {
  font-size: 13px; color: var(--text-muted, #8484a6); text-decoration: none; font-weight: 600;
  transition: color 0.15s ease;
}
.gate-compare-link:hover { color: var(--text-primary, #e8e8f0); }
.gate-footer-note {
  margin-top: 24px; font-size: 11.5px; color: var(--text-muted, #666680);
}
      `}</style>
    </div>
  );
}
