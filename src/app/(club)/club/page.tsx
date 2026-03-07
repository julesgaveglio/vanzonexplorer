import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { getFeaturedProducts, getBrands } from "@/lib/club/data";
import ClubLandingPage from "./_components/ClubLandingPage";

export const metadata: Metadata = {
  title: "Club Privé Vanzon — Deals & Codes Promo Vanlife",
  description: "Accédez aux meilleurs deals, codes promo et réductions exclusives pour l'aménagement de votre van. Abonnement 9,99€/mois.",
};

export const dynamic = "force-dynamic";

export default async function ClubPage() {
  const { userId } = await auth();

  const [previewProducts, trustedBrands] = await Promise.all([
    getFeaturedProducts(),
    getBrands({ trustedOnly: true }),
  ]);

  return (
    <ClubLandingPage
      previewProducts={previewProducts}
      brands={trustedBrands}
      isLoggedIn={!!userId}
    />
  );
}
