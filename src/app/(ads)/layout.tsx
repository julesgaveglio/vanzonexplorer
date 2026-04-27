import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getAdsSession } from "@/lib/ads-auth";
import AdsNavLinks from "./ads/_components/AdsNavLinks";
import AdsLogoutButton from "./ads/_components/AdsLogoutButton";
import AdsMobileMenu from "./ads/_components/AdsMobileMenu";

export const metadata = {
  title: "Vanzon Ads — Media Buyer Dashboard",
  robots: { index: false, follow: false },
};

export default async function AdsLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdsSession();
  if (!session) redirect("/ads-login");

  return (
    <section className="min-h-screen bg-slate-50">
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4 sm:gap-6 min-w-0">
              <Link href="/ads" className="flex-shrink-0">
                <Image
                  src="/icons/vanzon-ads-logo.png"
                  alt="Vanzon Ads"
                  width={180}
                  height={50}
                  className="h-10 sm:h-12 w-auto"
                  unoptimized
                />
              </Link>
              {/* Desktop nav */}
              <div className="hidden sm:block">
                <AdsNavLinks />
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              {/* Desktop: email + logout */}
              <span className="text-xs text-slate-400 hidden sm:block">{session.email}</span>
              <div className="hidden sm:block">
                <AdsLogoutButton />
              </div>
              {/* Mobile: burger menu */}
              <AdsMobileMenu email={session.email} />
            </div>
          </div>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</div>
    </section>
  );
}
