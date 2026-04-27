import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

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
    <section className="min-h-screen bg-[#0B0F1A]">
      <nav className="border-b border-white/10 bg-[#0B0F1A]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/ads" className="text-white font-bold text-lg tracking-tight">
              Vanzon <span className="text-blue-400">Ads</span>
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href="/ads"
              className="px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/ads/leads"
              className="px-3 py-1.5 text-sm font-medium text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            >
              Leads
            </Link>
          </div>
          <span className="text-xs text-slate-500 hidden sm:block">{email}</span>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</div>
    </section>
  );
}
