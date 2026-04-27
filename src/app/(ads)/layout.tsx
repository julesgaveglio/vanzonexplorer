import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import AdsNavLinks from "./ads/_components/AdsNavLinks";

const MEDIA_BUYER_EMAILS = ["gavegliojules@gmail.com", "mateogb.ads@gmail.com"];

export const metadata = {
  title: "Vanzon Ads — Media Buyer Dashboard",
  robots: { index: false, follow: false },
};

export default async function AdsLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (!email || !MEDIA_BUYER_EMAILS.includes(email)) {
    redirect("/");
  }

  return (
    <section className="min-h-screen bg-slate-50">
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link href="/ads" className="text-slate-900 font-bold text-lg tracking-tight">
              Vanzon <span className="text-blue-600">Ads</span>
            </Link>
            <AdsNavLinks />
          </div>
          <span className="text-xs text-slate-400 hidden sm:block">{email}</span>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</div>
    </section>
  );
}
