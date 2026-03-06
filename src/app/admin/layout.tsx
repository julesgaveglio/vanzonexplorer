import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import AdminSidebar from "./_components/AdminSidebar";

const ALLOWED_EMAIL = "gavegliojules@gmail.com";

export const metadata = {
  title: "Admin — Vanzon Explorer",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (email !== ALLOWED_EMAIL) redirect("/");

  return (
    <div className="min-h-screen" style={{ background: "#F1F5F9" }}>
      <AdminSidebar />
      <div className="pl-[260px]">
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}
