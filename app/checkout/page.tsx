import CheckoutClient from "@/components/CheckoutClient";
import { baseMetadata } from "@/lib/seo";
import { isPlanId } from "@/lib/checkout";
import { headers } from "next/headers";

export const metadata = baseMetadata({
  title: "Checkout",
  description: "Get Context Fence Starter or Teams.",
  path: "/checkout",
  robots: { index: false, follow: false },
});

export default function CheckoutPage({
  searchParams,
}: {
  searchParams?: { plan?: string; nodes?: string; addNodes?: string; cycle?: string };
}) {
  const planParam = searchParams?.plan;
  const planId = isPlanId(planParam) ? planParam : "starter";
  const rawNodes = searchParams?.nodes ? parseInt(searchParams.nodes, 10) : NaN;
  const initialNodes = Number.isFinite(rawNodes) ? rawNodes : undefined;
  const rawAddNodes = searchParams?.addNodes ? parseInt(searchParams.addNodes, 10) : NaN;
  const initialAddNodes = Number.isFinite(rawAddNodes) && rawAddNodes > 0 ? Math.min(rawAddNodes, 10) : undefined;
  const initialCycle = searchParams?.cycle === "monthly" ? "monthly" as const : "yearly" as const;
  // country from ip — Vercel populates x-vercel-ip-country (ISO code).
  // accept either that or a full name so local dev + geojs both work.
  const rawCountry =
    headers().get("x-vercel-ip-country-name") ??
    headers().get("x-vercel-ip-country") ??
    null;
  const ISO_TO_NAME: Record<string, string> = {
    IN: "India",
    US: "United States",
    GB: "United Kingdom",
    UK: "United Kingdom",
    AU: "Australia",
    NZ: "New Zealand",
    AE: "United Arab Emirates",
    SA: "Saudi Arabia",
    QA: "Qatar",
    KW: "Kuwait",
    BH: "Bahrain",
    OM: "Oman",
    SG: "Singapore",
    CA: "Canada",
    DE: "Germany",
    FR: "France",
    ES: "Spain",
    IT: "Italy",
    NL: "Netherlands",
    IE: "Ireland",
    AT: "Austria",
    BE: "Belgium",
    PT: "Portugal",
    FI: "Finland",
    GR: "Greece",
    PL: "Poland",
    SE: "Sweden",
    NO: "Norway",
    DK: "Denmark",
    CH: "Switzerland",
    JP: "Japan",
    KR: "South Korea",
    CN: "China",
    BR: "Brazil",
    MX: "Mexico",
    AR: "Argentina",
    CL: "Chile",
    CO: "Colombia",
    ZA: "South Africa",
    NG: "Nigeria",
    KE: "Kenya",
    EG: "Egypt",
    IL: "Israel",
    TR: "Turkey",
    TH: "Thailand",
    MY: "Malaysia",
    ID: "Indonesia",
    PH: "Philippines",
    VN: "Vietnam",
    HK: "Hong Kong",
    TW: "Taiwan",
  };
  const geoCountry =
    rawCountry && rawCountry.length === 2
      ? (ISO_TO_NAME[rawCountry.toUpperCase()] ?? rawCountry)
      : rawCountry;
  return (
    <main>
      <CheckoutClient planId={planId} geoCountry={geoCountry} initialNodes={initialNodes} initialAddNodes={initialAddNodes} initialCycle={initialCycle} />
    </main>
  );
}