import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FloatingCTA from "@/components/layout/FloatingCTA";
import { ArticleCategoryProvider } from "@/lib/contexts/ArticleCategoryContext";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ArticleCategoryProvider>
      <Navbar />
      <main className="pt-16 min-h-screen">{children}</main>
      <Footer />
      <FloatingCTA />
    </ArticleCategoryProvider>
  );
}
