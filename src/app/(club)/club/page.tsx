import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { getProducts, getBrands, getCategories } from "@/lib/club/data";
import ClubLandingPage from "./_components/ClubLandingPage";
import type { Product } from "@/lib/club/types";

export const metadata: Metadata = {
  title: "Club Privé Vanzon — Deals & Codes Promo Vanlife",
  description: "Accédez aux meilleurs deals, codes promo et réductions exclusives pour l'aménagement de votre van. Abonnement 9,99€/mois.",
  alternates: {
    canonical: "https://vanzonexplorer.com/club",
  },
};

export const dynamic = "force-dynamic";

/** Max 2 produits par marque pour diversifier l'affichage */
function diversify(products: Product[], maxPerBrand = 2): Product[] {
  const seen: Record<string, number> = {};
  return products.filter((p) => {
    const key = p.brand.id;
    seen[key] = (seen[key] || 0) + 1;
    return seen[key] <= maxPerBrand;
  });
}

export default async function ClubPage() {
  const { userId } = await auth();

  const [allProducts, partnerBrands, categories] = await Promise.all([
    getProducts({ limit: 60 }),
    getBrands({ partnerOnly: true }),
    getCategories(),
  ]);

  // Tri intelligent : featured en premier, puis priority_score, diversifié par marque
  const sorted = [...allProducts].sort((a, b) => {
    if (a.isFeatured && !b.isFeatured) return -1;
    if (!a.isFeatured && b.isFeatured) return 1;
    return b.priorityScore - a.priorityScore;
  });
  const previewProducts = diversify(sorted, 2).slice(0, 9);

  return (
    <ClubLandingPage
      previewProducts={previewProducts}
      allProducts={allProducts}
      brands={partnerBrands}
      categories={categories}
      isLoggedIn={!!userId}
    />
  );
}
