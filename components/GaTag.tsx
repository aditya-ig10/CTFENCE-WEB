"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";
import { CONSENT_EVENT, hasAnalyticsConsent } from "@/lib/consent";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

// gtag pushed onto window by the inline init script; typed loosely here
type GtagWindow = Window & { gtag?: (...args: unknown[]) => void };

// Analytics loads ONLY with an explicit opt-in (see lib/consent). The banner
// defaults to off, a decline never loads this component's scripts, and
// changing the choice in cookie settings enables/disables live.
export default function GaTag() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(hasAnalyticsConsent());
    const onConsent = () => setAllowed(hasAnalyticsConsent());
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  useEffect(() => {
    if (!GA_ID || !allowed || typeof window === "undefined") return;
    const gtag = (window as GtagWindow).gtag;
    if (!gtag) return;
    // app router pages not auto-tracked; fire manually
    gtag("config", GA_ID, {
      page_path: pathname + (searchParams?.toString() ? `?${searchParams}` : ""),
    });
  }, [pathname, searchParams, allowed]);

  if (!GA_ID || !allowed) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
      </Script>
    </>
  );
}