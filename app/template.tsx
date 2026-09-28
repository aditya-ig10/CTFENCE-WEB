"use client";

// Page enter animation, one system for every route change. template.tsx
// re-mounts on each navigation, so this runs per page: fade in + rise
// 16px, 450ms, cubic-bezier(0.22, 1, 0.36, 1). Back/forward navigations
// play the short variant (250ms, no stagger). Excluded routes (checkout,
// account, admin) render instantly. Navbar/Footer live in the layout above
// this file, so they never animate.

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { consumePopNav } from "@/lib/route-anim";

const EXCLUDED_PREFIXES = ["/checkout", "/dashboard", "/profile", "/admin"];

export default function Template({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [reduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [short] = useState(() => consumePopNav());

  const skip =
    reduced || EXCLUDED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  if (skip) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: short ? 0.25 : 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
