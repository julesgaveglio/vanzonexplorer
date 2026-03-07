"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { Category } from "@/lib/club/types";
import { Home, Zap, Droplets, Bed, Cable, Wifi, Wrench, Tent, Backpack } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = { Home, Zap, CookingPot: Zap, Droplets, Bed, Cable, Wifi, Wrench, Backpack, Tent };
const getCategoryIcon = (name: string) => iconMap[name] || Wrench;

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function CategoriesClient({ categories }: { categories: Category[] }) {
  return (
    <div className="py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="font-display text-5xl md:text-7xl tracking-display text-earth">Catégories</h1>
          <p className="text-muted mt-4 text-lg max-w-xl mx-auto">
            Retrouve tous les bons plans classés par type d&apos;équipement pour ton aménagement van.
          </p>
        </motion.div>

        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => {
            const Icon = getCategoryIcon(cat.icon);
            return (
              <motion.div key={cat.id} variants={item}>
                <Link href={`/club/deals?category=${cat.slug}`}>
                  <div className="bg-white rounded-xl p-6 border border-border hover:border-rust/30 hover:shadow-md transition-all duration-300 group h-full">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-cream rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-rust/10 transition-colors">
                        <Icon className="w-6 h-6 text-earth group-hover:text-rust transition-colors" />
                      </div>
                      <div className="flex-1">
                        <h2 className="font-medium text-earth text-lg group-hover:text-rust transition-colors">{cat.name}</h2>
                        <p className="text-sm text-muted mt-1 leading-relaxed">{cat.description}</p>
                        <span className="inline-block mt-3 text-xs font-medium text-rust bg-rust/10 px-3 py-1 rounded-full">
                          {cat.productCount} offres
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
