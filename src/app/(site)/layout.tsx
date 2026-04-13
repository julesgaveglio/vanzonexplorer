import { Suspense } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FloatingCTA from "@/components/layout/FloatingCTA";
import AdLandingGuard from "@/components/layout/AdLandingGuard";
import MainWithPadding from "@/components/layout/MainWithPadding";
import { ArticleCategoryProvider } from "@/lib/contexts/ArticleCategoryContext";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ArticleCategoryProvider>
      <Suspense>
        <AdLandingGuard>
          <Navbar />
        </AdLandingGuard>
      </Suspense>
      <Suspense>
        <MainWithPadding>{children}</MainWithPadding>
      </Suspense>
      <Suspense>
        <AdLandingGuard>
          <Footer />
          <FloatingCTA />
        </AdLandingGuard>
      </Suspense>
    </ArticleCategoryProvider>
  );
}
