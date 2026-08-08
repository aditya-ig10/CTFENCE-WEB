import Link from "next/link";
import { footer } from "@/content/copy";

export default function Footer() {
  return (
    <footer className="footer">
      <p className="footer-copy">{footer.copy}</p>
      <ul className="footer-links">
        {footer.links.map((l) => (
          <li key={l.href}>
            <Link href={l.href}>{l.label}</Link>
          </li>
        ))}
      </ul>
    </footer>
  );
}