import { DM_Mono } from "next/font/google";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FloatingCTA from "@/components/layout/FloatingCTA";

const dmMono = DM_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-dm-mono",
  display: "swap",
});

export default function ClubLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`club-layout ${dmMono.variable} min-h-screen bg-cream text-earth antialiased`}>
      <Navbar />
      <main className="pt-16 min-h-screen">{children}</main>
      <Footer />
      <FloatingCTA />
    </div>
  );
}
