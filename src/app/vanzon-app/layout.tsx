import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import BottomNav from "./_components/BottomNav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Vanzon Explorer",
  manifest: "/vanzon-app/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Vanzon",
  },
};

export default function VanzonAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body
        className={`${inter.variable} font-sans antialiased`}
        style={{
          minHeight: "100vh",
          background: "#F8FAFC",
          paddingBottom: "calc(5rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
