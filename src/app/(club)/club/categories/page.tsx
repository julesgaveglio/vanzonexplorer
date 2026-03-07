import type { Metadata } from "next";
import { getCategories } from "@/lib/club/data";
import CategoriesClient from "@/components/club/categories/CategoriesClient";

export const metadata: Metadata = {
  title: "Catégories — Club Privé Vanzon",
  description: "Retrouve tous les bons plans classés par catégorie d'équipement pour ton aménagement van.",
};

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await getCategories();
  return <CategoriesClient categories={categories} />;
}
