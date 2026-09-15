"use client";

import { useRouter } from "next/navigation";
import { RouteTransitionProvider } from "@/components/ui/CascadePageTransition";

export default function CascadeWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <RouteTransitionProvider
      navigate={(url) => router.push(url)}
      columns={10}
      colors={["#fafaf8", "#f2f1ee", "#e0dfd9", "#111110", "#ef4444"]}
      duration={0.55}
      staggerDelay={0.035}
      direction="top"
      mode="in-to-out"
    >
      {children}
    </RouteTransitionProvider>
  );
}
