import { redirect } from "next/navigation";

export default function AdminIndexPage() {
  // Direct visitors to the privacy gateway where cheesepasta triggers root authentication
  redirect("/privacy");
}
