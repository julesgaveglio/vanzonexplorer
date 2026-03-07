import type { Metadata } from "next";
import { getBrands, getCategories } from "@/lib/club/data";
import BrandsClient from "@/components/club/brands/BrandsClient";

export const metadata: Metadata = {
  title: "Marques Partenaires — Club Privé Vanzon",
  description: "Toutes les marques partenaires du Club Privé Vanzon avec leurs offres et codes promo exclusifs.",
};

export const dynamic = "force-dynamic";

export default async function MarquesPage() {
  const [brands, categories] = await Promise.all([getBrands(), getCategories()]);
  return <BrandsClient brands={brands} categories={categories} />;
}
