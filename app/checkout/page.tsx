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
  searchParams?: { plan?: string; nodes?: string; addNodes?: string };
}) {
  const planParam = searchParams?.plan;
  const planId = isPlanId(planParam) ? planParam : "starter";
  const rawNodes = searchParams?.nodes ? parseInt(searchParams.nodes, 10) : NaN;
  const initialNodes = Number.isFinite(rawNodes) ? rawNodes : undefined;
  const rawAddNodes = searchParams?.addNodes ? parseInt(searchParams.addNodes, 10) : NaN;
  const initialAddNodes = Number.isFinite(rawAddNodes) && rawAddNodes > 0 ? Math.min(rawAddNodes, 10) : undefined;
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
    AE: "United Arab Emirates",
    SG: "Singapore",
    CA: "Canada",
    DE: "Germany",
    FR: "France",
    JP: "Japan",
    BR: "Brazil",
  };
  const geoCountry =
    rawCountry && rawCountry.length === 2
      ? (ISO_TO_NAME[rawCountry.toUpperCase()] ?? rawCountry)
      : rawCountry;
  return (
    <main>
      <CheckoutClient planId={planId} geoCountry={geoCountry} initialNodes={initialNodes} initialAddNodes={initialAddNodes} />
    </main>
  );
}