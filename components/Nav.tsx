import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { nav, site } from "@/content/copy";

function Logo({ width = 28, height = 28 }: { width?: number; height?: number }) {
  return (
    <svg
      className="logo-icon"
      width={width}
      height={height}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`${site.name} logo`}
    >
      <rect x="1" y="1" width="26" height="26" stroke="var(--accent)" strokeWidth="1.5" />
      <path d="M7 14h6M15 10l4 4-4 4" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="square" />
      <rect x="6" y="6" width="4" height="4" fill="var(--accent)" opacity="0.3" />
      <rect x="18" y="18" width="4" height="4" fill="var(--accent)" opacity="0.3" />
    </svg>
  );
}

export default function Nav() {
  const [word, rest] = site.name.split(" ");

  return (
    <nav className="nav">
      <Link href="/" className="nav-logo" aria-label={`${site.name} home`}>
        <Logo />
        <span className="nav-wordmark">
          {word}
          <span>{rest ? ` ${rest}` : ""}</span>
        </span>
      </Link>
      <ul className="nav-links">
        {nav.links.map((l) => (
          <li key={l.href}>
            <Link href={l.href}>{l.label}</Link>
          </li>
        ))}
      </ul>
      <div className="nav-right">
        <ThemeToggle />
        <Link href={nav.cta.href} className="nav-cta">
          {nav.cta.label}
        </Link>
      </div>
    </nav>
  );
}