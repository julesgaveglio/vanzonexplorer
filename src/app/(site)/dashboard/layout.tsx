import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Image from "next/image";
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

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";
  const name = user?.fullName ?? user?.firstName ?? email;

  return (
    <section className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="https://cdn.sanity.io/images/lewexa74/production/1f483103ef15ee3549eab14ba2801d11b32a9055-313x313.png"
              alt="Vanzon Explorer"
              width={36}
              height={36}
              className="rounded-lg"
              unoptimized
            />
            <div>
              <h1 className="text-lg font-bold text-slate-900">Mon espace</h1>
              <p className="text-xs text-slate-400">{email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-500 hidden sm:inline">{name}</span>
            <a
              href="/"
              className="px-3 py-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Retour au site
            </a>
          </div>
        </div>
      </div>

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
