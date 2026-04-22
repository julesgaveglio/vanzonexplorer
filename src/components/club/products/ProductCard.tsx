"use client";

import Image from "next/image";
import Link from "next/link";
import { Tag } from "lucide-react";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: {
    image: string;
    name: string;
    slug: string;
    brand: { name: string };
    originalPrice: number;
    promoPrice: number;
    discount: number;
    promoCode: string | null;
    category: { name: string };
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/club/deals/${product.slug}`}>
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className="group relative overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-300 hover:shadow-md"
      >
        <div className="relative aspect-[3/2] overflow-hidden bg-earth/5">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {product.discount > 0 && (
            <span className="absolute left-3 top-3 rounded-full bg-rust px-2.5 py-1 text-xs font-bold text-cream">
              -{product.discount}%
            </span>
          )}
          <span className="absolute right-3 top-3 rounded-full bg-earth/80 px-2 py-1 text-xs text-cream">
            {product.category.name}
          </span>
        </div>

        <div className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted">{product.brand.name}</p>
          <h3 className="mt-1 line-clamp-2 text-sm font-medium text-earth">{product.name}</h3>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-lg font-bold text-rust">{product.promoPrice}&euro;</span>
            <span className="text-sm text-muted line-through">{product.originalPrice}&euro;</span>
          </div>
          {product.promoCode && (
            <div className="mt-3 flex items-center justify-between rounded-lg bg-earth px-3 py-2 text-cream">
              <div className="flex items-center gap-1.5">
                <Tag className="h-3 w-3" />
                <span className="font-display text-xs tracking-wider">{product.promoCode}</span>
              </div>
              <span className="text-xs text-cream/60">Code promo</span>
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  );
}
