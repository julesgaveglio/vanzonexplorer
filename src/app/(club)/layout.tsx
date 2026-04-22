import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FloatingCTA from "@/components/layout/FloatingCTA";

export default function ClubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="club-layout min-h-screen bg-cream text-earth antialiased">
      <Navbar />
      <main className="pt-16 min-h-screen">{children}</main>
      <Footer />
      <FloatingCTA />
    </div>
  );
}
