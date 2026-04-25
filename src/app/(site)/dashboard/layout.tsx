import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardNav from "./_components/DashboardNav";

export const metadata = {
  title: "Mon espace — Vanzon Explorer",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <section className="min-h-screen bg-slate-50">
      {/* Navigation secondaire */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <DashboardNav />
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
    </section>
  );
}
