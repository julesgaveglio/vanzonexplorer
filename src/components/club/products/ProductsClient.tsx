"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import ProductCard from "@/components/club/products/ProductCard";
import SearchBar from "@/components/club/search/SearchBar";
import type { Product, Category, Brand } from "@/lib/club/types";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const PRODUCTS_PER_PAGE = 9;

const offerTypeOptions = [
  { value: "code_promo", label: "Code promo" },
  { value: "reduction_directe", label: "Réduction directe" },
  { value: "affiliation", label: "Affiliation" },
] as const;

const priceRangeOptions = [
  { value: "0-100",   label: "Moins de 100€",  min: 0,   max: 100 },
  { value: "100-300", label: "100€ - 300€",     min: 100, max: 300 },
  { value: "300-700", label: "300€ - 700€",     min: 300, max: 700 },
  { value: "700+",    label: "Plus de 700€",    min: 700, max: Infinity },
] as const;

interface ProductsClientProps {
  products: Product[];
  categories: Category[];
  brands: Brand[];
}

export default function ProductsClient({ products, categories, brands }: ProductsClientProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedOfferType, setSelectedOfferType] = useState<string | null>(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    setVisibleCount(PRODUCTS_PER_PAGE);
  }, [selectedCategory, selectedBrand, selectedOfferType, selectedPriceRange, searchQuery]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (selectedCategory && product.category.slug !== selectedCategory) return false;
      if (selectedBrand && product.brand.slug !== selectedBrand) return false;
      if (selectedOfferType && product.offerType !== selectedOfferType) return false;
      if (selectedPriceRange) {
        const range = priceRangeOptions.find((r) => r.value === selectedPriceRange);
        if (range && (product.promoPrice < range.min || product.promoPrice >= range.max)) return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !product.name.toLowerCase().includes(q) &&
          !product.brand.name.toLowerCase().includes(q) &&
          !product.category.name.toLowerCase().includes(q) &&
          !product.description.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [products, selectedCategory, selectedBrand, selectedOfferType, selectedPriceRange, searchQuery]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;
  const handleSearch = useCallback((query: string) => { setSearchQuery(query); }, []);

  const resetFilters = () => {
    setSelectedCategory(null);
    setSelectedBrand(null);
    setSelectedOfferType(null);
    setSelectedPriceRange(null);
    setSearchQuery("");
  };

  const activeFilterCount = [selectedCategory, selectedBrand, selectedOfferType, selectedPriceRange].filter(Boolean).length;
  const activeFilters: { key: string; label: string; onRemove: () => void }[] = [];
  if (selectedCategory) {
    const cat = categories.find((c) => c.slug === selectedCategory);
    activeFilters.push({ key: "category", label: cat?.name || selectedCategory, onRemove: () => setSelectedCategory(null) });
  }
  if (selectedBrand) {
    const brand = brands.find((b) => b.slug === selectedBrand);
    activeFilters.push({ key: "brand", label: brand?.name || selectedBrand, onRemove: () => setSelectedBrand(null) });
  }
  if (selectedOfferType) {
    const offer = offerTypeOptions.find((o) => o.value === selectedOfferType);
    activeFilters.push({ key: "offerType", label: offer?.label || selectedOfferType, onRemove: () => setSelectedOfferType(null) });
  }
  if (selectedPriceRange) {
    const range = priceRangeOptions.find((r) => r.value === selectedPriceRange);
    activeFilters.push({ key: "priceRange", label: range?.label || selectedPriceRange, onRemove: () => setSelectedPriceRange(null) });
  }

  const filtersContent = (
    <>
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-medium text-earth">Catégories</h3>
        <div className="flex flex-col gap-0.5">
          <button onClick={() => setSelectedCategory(null)} className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${selectedCategory === null ? "bg-rust/10 font-medium text-rust" : "text-muted hover:bg-white hover:text-earth"}`}>Toutes</button>
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setSelectedCategory(cat.slug)} className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${selectedCategory === cat.slug ? "bg-rust/10 font-medium text-rust" : "text-muted hover:bg-white hover:text-earth"}`}>{cat.name}</button>
          ))}
        </div>
      </div>
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-medium text-earth">Marques</h3>
        <div className="flex flex-col gap-0.5">
          <button onClick={() => setSelectedBrand(null)} className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${selectedBrand === null ? "bg-rust/10 font-medium text-rust" : "text-muted hover:bg-white hover:text-earth"}`}>Toutes</button>
          {brands.map((brand) => (
            <button key={brand.id} onClick={() => setSelectedBrand(brand.slug)} className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${selectedBrand === brand.slug ? "bg-rust/10 font-medium text-rust" : "text-muted hover:bg-white hover:text-earth"}`}>{brand.name}</button>
          ))}
        </div>
      </div>
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-medium text-earth">Type d&apos;offre</h3>
        <div className="flex flex-col gap-0.5">
          <button onClick={() => setSelectedOfferType(null)} className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${selectedOfferType === null ? "bg-rust/10 font-medium text-rust" : "text-muted hover:bg-white hover:text-earth"}`}>Tous</button>
          {offerTypeOptions.map((offer) => (
            <button key={offer.value} onClick={() => setSelectedOfferType(offer.value)} className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${selectedOfferType === offer.value ? "bg-rust/10 font-medium text-rust" : "text-muted hover:bg-white hover:text-earth"}`}>{offer.label}</button>
          ))}
        </div>
      </div>
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-medium text-earth">Fourchette de prix</h3>
        <div className="flex flex-col gap-0.5">
          <button onClick={() => setSelectedPriceRange(null)} className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${selectedPriceRange === null ? "bg-rust/10 font-medium text-rust" : "text-muted hover:bg-white hover:text-earth"}`}>Toutes</button>
          {priceRangeOptions.map((range) => (
            <button key={range.value} onClick={() => setSelectedPriceRange(range.value)} className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${selectedPriceRange === range.value ? "bg-rust/10 font-medium text-rust" : "text-muted hover:bg-white hover:text-earth"}`}>{range.label}</button>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 md:pt-8">
        <div className="flex">
          {/* Desktop Sidebar */}
          <aside className="hidden w-64 flex-shrink-0 md:block">
            <div className="sticky top-24">
              <h2 className="mb-6 font-display text-2xl tracking-wide text-earth">Filtres</h2>
              {filtersContent}
            </div>
          </aside>

          {/* Mobile Filter Toggle */}
          <div className="fixed left-0 right-0 top-16 z-30 bg-cream/95 px-4 py-3 backdrop-blur-sm md:hidden">
            <button onClick={() => setMobileFiltersOpen(true)} className="flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2.5 text-sm font-medium text-earth transition hover:border-rust">
              <SlidersHorizontal className="h-4 w-4" />
              Filtres
              {activeFilterCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rust text-xs font-bold text-cream">{activeFilterCount}</span>
              )}
            </button>
          </div>

          {/* Mobile Filter Overlay */}
          <AnimatePresence>
            {mobileFiltersOpen && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-earth/40" onClick={() => setMobileFiltersOpen(false)} />
                <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-cream px-6 pb-8 pt-4">
                  <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted/30" />
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="font-display text-2xl tracking-wide text-earth">Filtres</h2>
                    <button onClick={() => setMobileFiltersOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-earth/10 text-earth transition hover:bg-earth/20"><X className="h-4 w-4" /></button>
                  </div>
                  {filtersContent}
                  <button onClick={() => setMobileFiltersOpen(false)} className="mt-4 w-full rounded-full bg-rust px-6 py-3 text-sm font-medium text-cream transition hover:bg-rust-dark">
                    Voir {filteredProducts.length} offre{filteredProducts.length !== 1 ? "s" : ""}
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <div className="ml-0 flex-1 md:ml-8">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">{filteredProducts.length} offre{filteredProducts.length !== 1 ? "s" : ""} trouvée{filteredProducts.length !== 1 ? "s" : ""}</p>
              <button className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm text-earth transition hover:border-rust">
                Trier par <ChevronDown className="h-4 w-4 text-muted" />
              </button>
            </div>

            <div className="mb-6 mt-4">
              <SearchBar onSearch={handleSearch} />
            </div>

            {activeFilters.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {activeFilters.map((filter) => (
                  <span key={filter.key} className="flex items-center gap-1 rounded-full bg-rust/10 px-3 py-1 text-xs text-rust">
                    {filter.label}
                    <button onClick={filter.onRemove} className="ml-0.5 transition hover:text-rust-dark"><X className="h-3 w-3" /></button>
                  </span>
                ))}
                {activeFilters.length > 1 && (
                  <button onClick={resetFilters} className="text-xs text-muted underline transition hover:text-earth">Tout effacer</button>
                )}
              </div>
            )}

            {filteredProducts.length > 0 ? (
              <>
                <motion.div layout className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {visibleProducts.map((product) => (
                      <motion.div key={product.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                        <ProductCard product={product} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
                <div className="mt-10 text-center">
                  {hasMore ? (
                    <button onClick={() => setVisibleCount((p) => p + PRODUCTS_PER_PAGE)} className="mx-auto block rounded-full border border-border bg-white px-8 py-3 text-sm font-medium text-earth transition hover:border-rust">
                      Charger plus
                    </button>
                  ) : (
                    <p className="text-center text-sm text-muted">Toutes les offres sont affichées</p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-earth/5">
                  <SlidersHorizontal className="h-7 w-7 text-muted" />
                </div>
                <h3 className="text-lg font-medium text-earth">Aucune offre trouvée</h3>
                <p className="mt-1 text-sm text-muted">Essayez de modifier vos filtres</p>
                <button onClick={resetFilters} className="mt-6 rounded-full bg-rust px-6 py-2.5 text-sm font-medium text-cream transition hover:bg-rust-dark">
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
