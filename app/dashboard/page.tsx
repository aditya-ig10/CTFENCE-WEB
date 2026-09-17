import WebPageSchema from "@/components/WebPageSchema";
import DashboardClient from "@/components/DashboardClient";
import { baseMetadata } from "@/lib/seo";

export const metadata = baseMetadata({
  title: "Dashboard — Your devices",
  description: "See and manage your Context Fence devices, plan and nodes.",
  path: "/dashboard",
  robots: { index: false, follow: false },
});

export default function DashboardPage() {
  return (
    <main>
      <WebPageSchema
        name="Dashboard — Your devices"
        description="See and manage your Context Fence devices, plan and nodes."
        path="/dashboard"
      />
      <DashboardClient />
    </main>
  );
}
