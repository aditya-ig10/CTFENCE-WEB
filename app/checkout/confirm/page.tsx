import CheckoutConfirm from "@/components/CheckoutConfirm";
import { baseMetadata } from "@/lib/seo";

export const metadata = baseMetadata({
  title: "Secure payment",
  description: "Settle your Context Fence plan securely.",
  path: "/checkout",
  robots: { index: false, follow: false },
});

export default function CheckoutConfirmPage({
  searchParams,
}: {
  searchParams?: { t?: string };
}) {
  return (
    <main>
      <CheckoutConfirm token={searchParams?.t ?? ""} />
    </main>
  );
}