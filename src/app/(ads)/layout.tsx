import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getAdsSession } from "@/lib/ads-auth";
import { CampaignProvider } from "./ads/_components/CampaignContext";
import AdsMenu from "./ads/_components/AdsMenu";

export const metadata = {
  title: "Vanzon Ads — Media Buyer Dashboard",
  robots: { index: false, follow: false },
};

export default async function AdsLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdsSession();
  if (!session) redirect("/ads-login");

  return (
    <CampaignProvider role={session.role}>
      <section className="min-h-screen bg-slate-50">
        <nav className="border-b border-slate-200 bg-white sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <Link href="/ads" className="flex-shrink-0">
                <Image
                  src="/icons/vanzon-ads-logo.png"
                  alt="Vanzon Ads"
                  width={180}
                  height={50}
                  className="h-9 sm:h-11 w-auto"
                  unoptimized
                />
              </Link>
              <AdsMenu email={session.email} />
            </div>
          </div>
        </nav>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</div>
      </section>
    </CampaignProvider>
  );
}
