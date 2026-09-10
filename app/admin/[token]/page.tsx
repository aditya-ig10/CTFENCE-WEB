import AdminDashboard from "@/components/admin/AdminDashboard";
import { baseMetadata } from "@/lib/seo";

export const metadata = baseMetadata({
  title: "Root Administration Console",
  description: "Context Fence operational fleet management, user access control, and telemetry hub.",
  path: "/admin",
  robots: { index: false, follow: false },
});

export default function AdminTokenPage({
  params,
}: {
  params: { token: string };
}) {
  return <AdminDashboard magicToken={params.token} />;
}
