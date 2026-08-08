// six glyphs for the capabilities grid. strokes use theme vars, not raw hex.
type IconName = "lock" | "shield" | "scan" | "list" | "pin" | "cloud";

const PATHS: Record<IconName, React.ReactNode> = {
  lock: (
    <>
      <rect x="9" y="18" width="22" height="13" stroke="var(--accent)" strokeWidth="1.5" />
      <path d="M13 18v-7a7 7 0 0 1 14 0v7" stroke="var(--info)" strokeWidth="1.5" />
      <circle cx="20" cy="24" r="2.5" fill="var(--accent)" />
    </>
  ),
  shield: (
    <>
      <path d="M20 5 32 10v9c0 8-5.4 13.6-12 16-6.6-2.4-12-8-12-16v-9L20 5Z" stroke="var(--accent)" strokeWidth="1.5" strokeLinejoin="bevel" />
      <path d="M15 20h3l2-4 3 8 2-4h3" stroke="var(--info)" strokeWidth="1.5" strokeLinecap="square" />
    </>
  ),
  scan: (
    <>
      <circle cx="20" cy="20" r="12" stroke="var(--accent)" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="5.5" stroke="var(--info)" strokeWidth="1.5" />
      <path d="M20 8v4.5M20 27.5V32M8 20h4.5M27.5 20H32" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="square" />
    </>
  ),
  list: (
    <>
      <rect x="5" y="11" width="30" height="6" stroke="var(--info)" strokeWidth="1.5" />
      <rect x="5" y="23" width="30" height="6" stroke="var(--info)" strokeWidth="1.5" />
      <circle cx="34" cy="14" r="2" fill="var(--accent)" />
      <circle cx="34" cy="26" r="2" fill="var(--accent)" />
    </>
  ),
  pin: (
    <>
      <path d="M20 4c-7 0-12 5.2-12 11.5C8 23 20 36 20 36s12-13 12-20.5C32 9.2 27 4 20 4Z" stroke="var(--accent)" strokeWidth="1.5" strokeLinejoin="bevel" />
      <circle cx="20" cy="15" r="4.5" stroke="var(--info)" strokeWidth="1.5" />
    </>
  ),
  cloud: (
    <>
      <path d="M13 28a7 7 0 0 1-1-13.9A9 9 0 0 1 29 15a6.5 6.5 0 0 1-2 12.7" stroke="var(--accent)" strokeWidth="1.5" strokeLinejoin="bevel" />
      <path d="M19 22l-4 4 4 4M15 26h8" stroke="var(--info)" strokeWidth="1.5" strokeLinecap="square" />
      <text x="29" y="10" fontSize="9" fill="var(--warn)" fontFamily="JetBrains Mono">?</text>
    </>
  ),
};

export function FeatureIcon({ name, alt }: { name: IconName; alt: string }) {
  return (
    <figure aria-label={alt} role="img" className="feat-icon" style={{ margin: 0, marginBottom: 20 }}>
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="1" y="1" width="38" height="38" stroke="var(--border)" strokeWidth="1" />
        {PATHS[name]}
      </svg>
    </figure>
  );
}