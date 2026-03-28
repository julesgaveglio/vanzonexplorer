import type { Metadata } from "next";
import { getProducts, getCategories, getBrands } from "@/lib/club/data";
import ProductsClient from "@/components/club/products/ProductsClient";

export const metadata: Metadata = {
  title: "Deals Vanlife — Club Privé Vanzon",
  description: "Tous les codes promo, réductions et bons plans exclusifs pour l'aménagement de votre van.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DealsPage() {
  const [products, categories, brands] = await Promise.all([
    getProducts(),
    getCategories(),
    getBrands(),
  ]);

  return <ProductsClient products={products} categories={categories} brands={brands} />;
}
