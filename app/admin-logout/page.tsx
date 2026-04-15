import { redirect } from "next/navigation";
import { clearPortalSession } from "@/lib/fashion-auth";

export default async function AdminLogoutPage() {
  await clearPortalSession();
  redirect("/admin-login");
}