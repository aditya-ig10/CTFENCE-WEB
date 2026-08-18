import WebPageSchema from "@/components/WebPageSchema";
import ThanksScene from "@/components/ThanksScene";
import { thankYou } from "@/content/copy";
import { baseMetadata } from "@/lib/seo";

export const metadata = baseMetadata({
  title: "Thank you",
  description: "Newsletter subscription received. The first issue lands within the month.",
  path: "/thank-you",
  robots: { index: false, follow: false },
});

export default function ThankYouPage() {
  return (
    <main className="thanks-page">
      <WebPageSchema
        name="Thank you"
        description="Newsletter subscription received."
        path="/thank-you"
      />
      <ThanksScene
        title={thankYou.title}
        line={thankYou.line}
        ctaLabel={thankYou.homeCta.label}
        ctaHref={thankYou.homeCta.href}
      />
    </main>
  );
}