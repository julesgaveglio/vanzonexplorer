import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AdLandingGuard from "@/components/layout/AdLandingGuard";
import MainWithPadding from "@/components/layout/MainWithPadding";
import AnalyticsTracker from "@/components/analytics/AnalyticsTracker";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AnalyticsTracker />
      <AdLandingGuard>
        <Navbar />
      </AdLandingGuard>
      <MainWithPadding>{children}</MainWithPadding>
      <AdLandingGuard>
        <Footer />
      </AdLandingGuard>
    </>
  );
}
