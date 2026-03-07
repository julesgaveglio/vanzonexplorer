"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Brand, Category } from "@/lib/club/types";
import BrandCard from "@/components/club/brands/BrandCard";

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

interface BrandsClientProps {
  brands: Brand[];
  categories: Category[];
}

export default function BrandsClient({ brands, categories }: BrandsClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const filteredBrands = selectedCategory ? brands.filter((b) => b.categories.includes(selectedCategory)) : brands;

  return (
    <div className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="font-display text-5xl md:text-7xl tracking-display text-earth">Marques</h1>
          <p className="text-muted mt-4 text-lg max-w-xl mx-auto">
            Découvre toutes les marques partenaires et leurs offres exclusives pour ton van.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-wrap justify-center gap-2 mb-10">
          <button onClick={() => setSelectedCategory(null)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === null ? "bg-rust text-cream" : "bg-white border border-border text-muted hover:text-earth hover:border-rust/30"}`}>
            Toutes
          </button>
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.slug)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === cat.slug ? "bg-rust text-cream" : "bg-white border border-border text-muted hover:text-earth hover:border-rust/30"}`}>
              {cat.name}
            </button>
          ))}
        </motion.div>

        <motion.div variants={container} initial="hidden" animate="show" key={selectedCategory ?? "all"} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredBrands.map((brand) => (
            <motion.div key={brand.id} variants={item}>
              <BrandCard brand={brand} />
            </motion.div>
          ))}
        </motion.div>

        {filteredBrands.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted">Aucune marque dans cette catégorie.</p>
            <button onClick={() => setSelectedCategory(null)} className="mt-4 text-rust hover:underline text-sm font-medium">
              Voir toutes les marques
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
