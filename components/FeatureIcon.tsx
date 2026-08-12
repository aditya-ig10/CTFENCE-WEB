// six glyphs for the capabilities grid. strokes use currentColor so they inherit theme + hover states.
type IconName = "lock" | "shield" | "scan" | "list" | "pin" | "cloud";

const PATHS: Record<IconName, React.ReactNode> = {
  lock: (
    <>
      <rect x="7.5" y="13.5" width="17" height="12" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 13.5v-4a5 5 0 0 1 10 0v4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="19.5" r="1.5" fill="currentColor" />
    </>
  ),
  shield: (
    <>
      <path d="M16 4.5 27 8.5v6c0 5-3.8 8.8-11 11-7.2-2.2-11-6-11-11v-6L16 4.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="bevel" />
      <path d="M12.5 15h2.5l1.5-3 2.5 6 1.5-3h2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </>
  ),
  scan: (
    <>
      <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 6v3M16 23v3M6 16h3M23 16h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </>
  ),
  list: (
    <>
      <path d="M5 9.5h22M5 16h22M5 22.5h22" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="1.5" cy="9.5" r="1" fill="currentColor" />
      <circle cx="1.5" cy="16" r="1" fill="currentColor" />
      <circle cx="1.5" cy="22.5" r="1" fill="currentColor" />
    </>
  ),
  pin: (
    <>
      <path d="M16 3.5c-5.2 0-9 3.8-9 8.4 0 5.4 9 13.6 9 13.6s9-8.2 9-13.6c0-4.6-3.8-8.4-9-8.4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="bevel" />
      <circle cx="16" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.5" />
    </>
  ),
  cloud: (
    <>
      <path d="M9.5 24a5.5 5.5 0 0 1-.8-10.9A7 7 0 0 1 22 11.5a5 5 0 0 1-1.5 9.7" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="bevel" />
      <path d="M15.5 17.5l-3 3 3 3M12.5 20.5h6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </>
  ),
};

export function FeatureIcon({ name, alt }: { name: IconName; alt: string }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="feat-icon"
      role="img"
      aria-label={alt}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}