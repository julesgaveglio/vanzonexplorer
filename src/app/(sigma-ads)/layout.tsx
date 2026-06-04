import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSigmaSession } from "@/app/api/sigma/_helpers/auth";
import { SigmaCampaignProvider } from "./sigma-ads/_components/SigmaCampaignContext";
import SigmaMenu from "./sigma-ads/_components/SigmaMenu";

export const metadata = {
  title: "Sigma Factory — Ads Dashboard",
  robots: { index: false, follow: false },
};

export default async function SigmaAdsLayout({ children }: { children: React.ReactNode }) {
  const session = await getSigmaSession();
  if (!session) redirect("/sigma-login");

  return (
    <SigmaCampaignProvider>
      <section className="min-h-screen bg-white">
        <nav className="border-b border-slate-200 bg-white sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <Link href="/sigma-ads" className="flex-shrink-0">
                <Image
                  src="/images/sigma-factory-logo.png"
                  alt="Sigma Factory"
                  width={280}
                  height={84}
                  className="h-14 sm:h-16 w-auto"
                  unoptimized
                />
              </Link>
              <SigmaMenu email={session.email} />
            </div>
          </div>
        </nav>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">{children}</div>
      </section>
    </SigmaCampaignProvider>
  );
}
