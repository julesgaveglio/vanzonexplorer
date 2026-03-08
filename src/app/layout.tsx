import type { Metadata } from "next";
import { Inter, Bebas_Neue } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { frFR } from "@clerk/localizations";
import { sanityFetch } from "@/lib/sanity/client";
import { getSiteSettingsQuery } from "@/lib/sanity/queries";
import CookieBanner from "@/components/ui/CookieBanner";
import { LocalBusinessJsonLd } from "@/components/seo/JsonLd";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas-neue",
  display: "swap",
});

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://vanzonexplorer.com";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await sanityFetch<{
    openGraphImageUrl?: string;
    openGraphImageAlt?: string;
    twitterHandle?: string;
  }>(getSiteSettingsQuery);

  const ogImages = settings?.openGraphImageUrl
    ? [{ url: settings.openGraphImageUrl, width: 1200, height: 630, alt: settings.openGraphImageAlt ?? "Vanzon Explorer" }]
    : [];

  return {
    title: {
      default: "Vanzon Explorer — Vanlife au Pays Basque",
      template: "%s | Vanzon Explorer",
    },
    icons: {
      icon: "https://cdn.sanity.io/images/lewexa74/production/1f483103ef15ee3549eab14ba2801d11b32a9055-313x313.png",
      apple: "https://cdn.sanity.io/images/lewexa74/production/1f483103ef15ee3549eab14ba2801d11b32a9055-313x313.png",
    },
    description:
      "Location de vans aménagés, achat/revente et formation vanlife au Pays Basque. Explorez la côte basque en toute liberté.",
    metadataBase: new URL(BASE_URL),
    openGraph: {
      type: "website",
      locale: "fr_FR",
      siteName: "Vanzon Explorer",
      images: ogImages.length > 0 ? ogImages : undefined,
    },
    twitter: {
      card: "summary_large_image",
      site: settings?.twitterHandle ?? undefined,
      images: ogImages.length > 0 ? ogImages.map((i) => i.url) : undefined,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={frFR} signInUrl="/sign-in" signUpUrl="/sign-up">
      <html lang="fr">
        <body
          className={`${inter.variable} ${bebasNeue.variable} font-sans antialiased bg-bg-primary text-text-primary min-h-screen`}
        >
          <LocalBusinessJsonLd />
          {children}
          <CookieBanner />
        </body>
      </html>
    </ClerkProvider>
  );
}
