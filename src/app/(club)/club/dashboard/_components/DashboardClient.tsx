"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";
import Link from "next/link";
import { createSupabaseAnon } from "@/lib/supabase/server";
import ProductCard from "@/components/club/products/ProductCard";
import { Bookmark, Bell, Tag, ChevronRight, Plus, Trash2, Loader2, ShoppingBag, LayoutGrid, Award } from "lucide-react";

type Tab = "saved" | "alerts" | "codes";

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "saved", label: "Offres sauvegardées", icon: Bookmark },
  { id: "alerts", label: "Alertes prix", icon: Bell },
  { id: "codes", label: "Codes récents", icon: Tag },
];

interface SavedDeal {
  id: string;
  product: {
    image: string;
    name: string;
    slug: string;
    brand: { name: string };
    category: { name: string };
    originalPrice: number;
    promoPrice: number;
    discount: number;
    promoCode: string | null;
  };
}

interface PriceAlert {
  id: string;
  targetPrice: number;
  isActive: boolean;
  product: { name: string; slug: string; promoPrice: number };
}

export default function DashboardClient() {
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState<Tab>("saved");
  const [savedDeals, setSavedDeals] = useState<SavedDeal[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);

  const fetchSavedDeals = useCallback(async () => {
    if (!user) return;
    const supabase = createSupabaseAnon();
    const { data } = await supabase
      .from("saved_products")
      .select("id, product_id(*, brand_id(*), category_id(*))")
      .eq("user_id", user.id);

    if (data) {
      setSavedDeals(data.map((row: Record<string, unknown>) => {
        const p = row.product_id as Record<string, unknown>;
        const brand = p.brand_id as Record<string, unknown>;
        const category = p.category_id as Record<string, unknown>;
        return {
          id: row.id as string,
          product: {
            name: p.name as string,
            slug: p.slug as string,
            image: (p.main_image_url as string) || "https://placehold.co/400x300?text=Produit",
            brand: { name: (brand?.name as string) || "Marque" },
            category: { name: (category?.name as string) || "Catégorie" },
            originalPrice: Number(p.original_price),
            promoPrice: Number(p.promo_price),
            discount: Number(p.discount_percent) || 0,
            promoCode: (p.promo_code as string) || null,
          },
        };
      }));
    }
  }, [user]);

  const fetchPriceAlerts = useCallback(async () => {
    if (!user) return;
    const supabase = createSupabaseAnon();
    const { data } = await supabase
      .from("price_alerts")
      .select("id, target_price, is_active, product_id(name, slug, promo_price)")
      .eq("user_id", user.id);

    if (data) {
      setPriceAlerts(data.map((row: Record<string, unknown>) => {
        const p = row.product_id as Record<string, unknown>;
        return {
          id: row.id as string,
          targetPrice: Number(row.target_price),
          isActive: row.is_active as boolean,
          product: { name: (p?.name as string) || "", slug: (p?.slug as string) || "", promoPrice: Number(p?.promo_price) || 0 },
        };
      }));
    }
  }, [user]);

  useEffect(() => {
    if (isLoaded && user) {
      fetchSavedDeals();
      fetchPriceAlerts();
    }
  }, [isLoaded, user, fetchSavedDeals, fetchPriceAlerts]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rust" />
      </div>
    );
  }

  return (
    <div className="px-4 py-12">
      <div className="mx-auto max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="font-display text-4xl tracking-display text-earth md:text-5xl">Mon espace</h1>
          <p className="mt-2 text-muted">Bonjour {user?.firstName || "explorateur"} — gérez vos deals et alertes.</p>
        </motion.div>

        <div className="flex flex-col gap-8 md:flex-row">
          <motion.aside initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex-shrink-0 md:w-64">
            <div className="md:sticky md:top-24 flex flex-col gap-3">
              <nav className="rounded-xl border border-border bg-white p-2">
                <p className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted">Explorer</p>
                {[
                  { label: "Offres", href: "/club/deals", icon: ShoppingBag },
                  { label: "Catégories", href: "/club/categories", icon: LayoutGrid },
                  { label: "Marques", href: "/club/marques", icon: Award },
                ].map(({ label, href, icon: Icon }) => (
                  <Link key={href} href={href} className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-muted transition-all hover:bg-cream hover:text-earth">
                    <Icon className="h-4 w-4" />{label}
                  </Link>
                ))}
              </nav>

              <nav className="rounded-xl border border-border bg-white p-2">
                <p className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-muted">Mon espace</p>
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-all ${activeTab === tab.id ? "bg-rust/10 text-rust" : "text-muted hover:bg-cream hover:text-earth"}`}>
                      <Icon className="h-4 w-4" />{tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </motion.aside>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex-1">
            {activeTab === "saved" && (
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="font-display text-2xl tracking-display text-earth">Offres sauvegardées</h2>
                  <span className="text-sm text-muted">{savedDeals.length} offres</span>
                </div>
                {savedDeals.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {savedDeals.map((deal) => <ProductCard key={deal.id} product={deal.product} />)}
                  </div>
                ) : <EmptyState message="Aucune offre sauvegardée" sub="Parcourez les offres et sauvegardez vos favoris." />}
              </div>
            )}

            {activeTab === "alerts" && (
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="font-display text-2xl tracking-display text-earth">Alertes prix</h2>
                  <button className="flex items-center gap-2 rounded-full bg-rust px-4 py-2 text-sm font-medium text-cream transition-colors hover:bg-rust-dark">
                    <Plus className="h-4 w-4" />Nouvelle alerte
                  </button>
                </div>
                {priceAlerts.length > 0 ? (
                  <div className="space-y-4">
                    {priceAlerts.map((alert) => (
                      <div key={alert.id} className="flex items-center gap-4 rounded-xl border border-border bg-white p-5">
                        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-cream">
                          <Bell className="h-6 w-6 text-rust" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <Link href={`/club/deals/${alert.product.slug}`} className="block truncate font-medium text-earth transition-colors hover:text-rust">{alert.product.name}</Link>
                          <p className="mt-1 text-sm text-muted">Alerte si le prix descend sous <span className="font-medium text-rust">{alert.targetPrice} &euro;</span></p>
                          <p className="mt-1 text-xs text-muted/60">Prix actuel : {alert.product.promoPrice} &euro;</p>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-3">
                          <span className={`rounded-full px-2 py-1 text-xs ${alert.isActive ? "bg-sage/10 text-sage" : "bg-muted/10 text-muted"}`}>
                            {alert.isActive ? "Active" : "Inactive"}
                          </span>
                          <button className="text-muted transition-colors hover:text-rust"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <EmptyState message="Aucune alerte prix" sub="Créez une alerte pour être notifié quand un produit baisse." />}
              </div>
            )}

            {activeTab === "codes" && (
              <div>
                <h2 className="mb-6 font-display text-2xl tracking-display text-earth">Codes promo utilisés</h2>
                <EmptyState message="Aucun code utilisé" sub="Vos codes promo utilisés apparaîtront ici." />
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ message, sub }: { message: string; sub: string }) {
  return (
    <div className="rounded-xl border border-border bg-white py-16 text-center">
      <p className="font-medium text-earth">{message}</p>
      <p className="mt-2 text-sm text-muted">{sub}</p>
      <Link href="/club/deals" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-rust hover:underline">
        Parcourir les offres <ChevronRight className="h-3 w-3" />
      </Link>
    </div>
  );
}
