import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import AdminShell from "../_components/AdminShell";

const ALLOWED_EMAIL = "gavegliojules@gmail.com";

export const metadata = {
  title: "Admin — Vanzon Explorer",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/admin/login");

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (email !== ALLOWED_EMAIL) redirect("/");

  return <AdminShell>{children}</AdminShell>;
}
