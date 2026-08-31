import WebPageSchema from "@/components/WebPageSchema";
import ProfileClient from "@/components/ProfileClient";
import { baseMetadata } from "@/lib/seo";

export const metadata = baseMetadata({
  title: "Your profile",
  description: "Your Context Fence account details.",
  path: "/profile",
  robots: { index: false, follow: false },
});

export default function ProfilePage() {
  return (
    <main>
      <WebPageSchema
        name="Your profile"
        description="Your Context Fence account details."
        path="/profile"
      />
      <ProfileClient />
    </main>
  );
}