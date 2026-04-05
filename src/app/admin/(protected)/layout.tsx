import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import AdminShell from "../_components/AdminShell";

// Emails admin autorisés — séparés par virgule dans ADMIN_EMAILS
const ALLOWED_EMAILS = (process.env.ADMIN_EMAILS ?? "gavegliojules@gmail.com,jules.skate64@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase());

export const metadata = {
  title: "Admin — Vanzon Explorer",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/admin/login");

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase() ?? "";
  if (!ALLOWED_EMAILS.includes(email)) redirect("/");

  return <AdminShell>{children}</AdminShell>;
}
