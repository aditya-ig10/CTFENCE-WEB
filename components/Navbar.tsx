"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import ThemeToggle from "@/components/ThemeToggle";
import { nav } from "@/content/copy";
import { motionAllowed } from "@/lib/anim";

const iconProps = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

function ProductIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 3l9 5v8l-9 5-9-5V8l9-5z" />
      <path d="M12 13l9-5M12 13L3 8M12 13v8" />
    </svg>
  );
}

function PricingIcon() {
  return (
    <svg {...iconProps}>
      <path d="M20.6 13.4L13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </svg>
  );
}

function DocsIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z" />
      <path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" />
    </svg>
  );
}

function BlogIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg {...iconProps}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();

  useEffect(() => {
    if (!motionAllowed()) return;
    const ctx = gsap.context(() => {
      gsap.from(".topbar", {
        y: -24,
        opacity: 0,
        duration: 0.5,
        ease: "power3.out",
      });
    });
    return () => ctx.revert();
  }, []);

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const icons: Record<string, React.ReactNode> = {
    Product: <ProductIcon />,
    Pricing: <PricingIcon />,
    Docs: <DocsIcon />,
    Blog: <BlogIcon />,
  };

  return (
    <>
      <header className="topbar" aria-label="Primary">
        <div className="topbar-inner">
          <nav className="topbar-nav">
            {nav.links.map((l) => (
              <Link key={l.href} href={l.href} className={isActive(l.href) ? "active" : undefined}>
                {icons[l.label]}
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="topbar-actions">
            <ThemeToggle />
            <Link href={nav.cta.href} className="topbar-cta">
              <span>{nav.cta.label}</span>
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </header>
      <div className="topbar-spacer" aria-hidden="true" />
    </>
  );
}
