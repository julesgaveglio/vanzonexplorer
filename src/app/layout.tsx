import type { Metadata, Viewport } from "next";
import { Inter, Bebas_Neue } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { frFR } from "@clerk/localizations";
import { sanityFetch } from "@/lib/sanity/client";
import { getSiteSettingsQuery } from "@/lib/sanity/queries";
import { getGooglePlaceStats } from "@/lib/google-places";
import CookieBanner from "@/components/ui/CookieBanner";
import { LocalBusinessJsonLd, WebSiteJsonLd } from "@/components/seo/JsonLd";
import Script from "next/script";
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

const BASE_URL = "https://vanzonexplorer.com";

export const viewport: Viewport = {
  themeColor: "#0F153A",
};

export async function generateMetadata(): Promise<Metadata> {
  const settings = await sanityFetch<{
    openGraphImageUrl?: string;
    openGraphImageAlt?: string;
    twitterHandle?: string;
  }>(getSiteSettingsQuery);

  const FALLBACK_OG = "https://cdn.sanity.io/images/lewexa74/production/d445397965472d300e3dc13d6b1c37503fe8ba25-1920x1080.png";
  const ogImages = [
    {
      url: settings?.openGraphImageUrl ?? FALLBACK_OG,
      width: 1200,
      height: 630,
      alt: settings?.openGraphImageAlt ?? "Vanzon Explorer — Vanlife au Pays Basque",
    },
  ];

  return {
    title: {
      default: "Vanzon Explorer — Vanlife au Pays Basque",
      template: "%s | Vanzon Explorer",
    },
    verification: {
      google: "WUpCcy6a6xeSOeV0P4FAdWxz-Yf5XAHz4JGr84HswC8",
    },
    icons: {
      icon: "https://cdn.sanity.io/images/lewexa74/production/1f483103ef15ee3549eab14ba2801d11b32a9055-313x313.png?v=2",
      apple: "https://cdn.sanity.io/images/lewexa74/production/1f483103ef15ee3549eab14ba2801d11b32a9055-313x313.png?v=2",
    },
    description:
      "Location, achat de vans aménagés, et formation vanlife au Pays Basque. Explorez la côte basque en toute liberté.",
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: BASE_URL,
    },
    openGraph: {
      type: "website",
      locale: "fr_FR",
      siteName: "Vanzon Explorer",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      site: settings?.twitterHandle ?? undefined,
      images: ogImages.map((i) => i.url),
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const placeStats = await getGooglePlaceStats();

  return (
    <ClerkProvider localization={frFR} signInUrl="/sign-in" signUpUrl="/sign-up">
      <html lang="fr">
        <body
          className={`${inter.variable} ${bebasNeue.variable} font-sans antialiased bg-bg-primary text-text-primary min-h-screen`}
        >
          <LocalBusinessJsonLd
            ratingValue={placeStats.ratingDisplay}
            reviewCount={placeStats.reviewCount}
          />
          <WebSiteJsonLd />
          {children}
          <CookieBanner />
          {/* Analytics chargé conditionnellement via CookieBanner après consentement */}
          <Script src="https://assets.calendly.com/assets/external/widget.js" strategy="lazyOnload" />
        </body>
      </html>
    </ClerkProvider>
  );
}
