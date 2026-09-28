"use client";

import { useRouter } from "next/navigation";
import { RouteTransitionProvider } from "@/components/ui/CascadePageTransition";

export default function CascadeWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <RouteTransitionProvider
      navigate={(url) => router.push(url)}
      columns={14}
      colors={["#ef4444"]}
      duration={0.4}
      staggerDelay={0.025}
      exitOpposite
      mode="in-to-out"
      showLeadingStroke={false}
      showTrailingStroke={false}
      strokeWidth={10}
      className="cf-cascade"
      panelClassName="cf-cascade-panel"
    >
      {children}
    </RouteTransitionProvider>
  );
}
