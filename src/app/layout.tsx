import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Vanzon Explorer — Vanlife au Pays Basque",
    template: "%s | Vanzon Explorer",
  },
  description:
    "Location de vans aménagés, achat/revente et formation vanlife au Pays Basque. Explorez la côte basque en toute liberté.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Vanzon Explorer",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${inter.variable} font-sans antialiased bg-bg-primary text-text-primary min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
