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

function BlogIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function EvidenceIcon() {
  return (
    <svg {...iconProps}>
      <path d="M4 22h16" />
      <path d="M6 18V8M12 18V4M18 18v-6" />
    </svg>
  );
}

function DownloadsIcon() {
  return (
    <svg {...iconProps}>
      <path d="M12 3v12M6 11l6 6 6-6" />
      <path d="M4 21h16" />
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
    Evidence: <EvidenceIcon />,
    Downloads: <DownloadsIcon />,
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
