"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Lock, Tag, RefreshCw, ShieldCheck } from "lucide-react";
import type { Product, Brand, Category } from "@/lib/club/types";
import OtherServices from "@/components/ui/OtherServices";

const ease = [0.25, 0.1, 0.25, 1] as const;
const fadeUp   = { hidden: { opacity: 0, y: 28 },  visible: { opacity: 1, y: 0,  transition: { duration: 0.6, ease } } };
const fadeLeft = { hidden: { opacity: 0, x: -28 }, visible: { opacity: 1, x: 0,  transition: { duration: 0.6, ease } } };
const stagger  = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const cardIn   = { hidden: { opacity: 0, y: 20 },  visible: { opacity: 1, y: 0,  transition: { duration: 0.5, ease } } };

interface ClubLandingPageProps {
  previewProducts: Product[];
  allProducts: Product[];
  brands: Brand[];
  categories: Category[];
  isLoggedIn?: boolean;
}

/** Max N produits par marque pour diversifier */
function diversifyLocal(products: Product[], maxPerBrand = 2): Product[] {
  const seen: Record<string, number> = {};
  return products.filter((p) => {
    const key = p.brand.id || p.brand.name;
    seen[key] = (seen[key] || 0) + 1;
    return seen[key] <= maxPerBrand;
  });
}

/** Détection intelligente du type de produit par mots-clés */
const SMART_CATEGORIES = [
  {
    slug: "batteries",
    name: "Batteries",
    keywords: ["batterie", "battery", "ac200", "ac300", "ac500", "ac60", "ac70", "ac180", "ac240", "eb", "ep200", "ep500", "elite", "rv5", "powerhub", "hub", "lifepo4", "lithium", "powerstation", "station"],
  },
  {
    slug: "panneaux-solaires",
    name: "Panneaux Solaires",
    keywords: ["panneau", "solar", "solaire", "pv", "sp", "photovoltaïque", "monocristallin", "polycristallin", "module solaire"],
  },
  {
    slug: "accessoires",
    name: "Accessoires",
    keywords: ["câble", "cable", "adaptateur", "chargeur", "bag", "valise", "sac", "extension", "connecteur", "support", "fixation", "protection", "housse", "cover"],
  },
];

function getSmartCategory(product: Product): string {
  const text = `${product.name} ${product.description}`.toLowerCase();
  for (const cat of SMART_CATEGORIES) {
    if (cat.keywords.some((kw) => text.includes(kw))) return cat.slug;
  }
  // Fallback sur la catégorie DB
  return product.category.slug;
}

/** Construit les onglets intelligents fusionnant catégories DB + smart */
function buildSmartTabs(products: Product[], dbCategories: Category[]): Array<{ slug: string; name: string }> {
  const tabs: Array<{ slug: string; name: string }> = [{ slug: "tous", name: "Tous" }];
  const seen = new Set<string>();

  // Catégories smart qui ont au moins 1 produit
  for (const cat of SMART_CATEGORIES) {
    if (products.some((p) => getSmartCategory(p) === cat.slug)) {
      tabs.push({ slug: cat.slug, name: cat.name });
      seen.add(cat.slug);
    }
  }

  // Catégories DB non couvertes par smart
  for (const cat of dbCategories) {
    const hasProducts = products.some((p) => p.category.slug === cat.slug);
    const alreadyCovered = SMART_CATEGORIES.some(() =>
      products.filter((p) => p.category.slug === cat.slug).every((p) => getSmartCategory(p) !== cat.slug)
    );
    if (hasProducts && !seen.has(cat.slug) && alreadyCovered) {
      tabs.push({ slug: cat.slug, name: cat.name });
    }
  }

  return tabs;
}

function filterBySmartCategory(products: Product[], slug: string): Product[] {
  if (slug === "tous") return products;
  const smart = SMART_CATEGORIES.find((c) => c.slug === slug);
  if (smart) return products.filter((p) => getSmartCategory(p) === slug);
  return products.filter((p) => p.category.slug === slug);
}

/** Logo marque dans le ticker — image avec fallback pill stylé */
function BrandLogoTicker({ brand }: { brand: Brand }) {
  const [imgFailed, setImgFailed] = useState(false);
  const src = brand.logoPng?.startsWith("http") ? brand.logoPng
    : brand.logo?.startsWith("http") ? brand.logo
    : null;

  if (src && !imgFailed) {
    return (
      <div className="flex-shrink-0 flex items-center px-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={brand.name}
          onError={() => setImgFailed(true)}
          className="h-7 w-auto max-w-[100px] object-contain"
          style={{ filter: "brightness(0) invert(1)", opacity: 0.7 }}
        />
      </div>
    );
  }

  // Fallback : initiale seule en blanc
  return (
    <div className="flex-shrink-0 flex items-center px-3">
      <span className="text-sm font-black text-white/50 tracking-widest uppercase">
        {brand.name.charAt(0)}
      </span>
    </div>
  );
}

/** Génère un SVG placeholder inline — aucune dépendance réseau, jamais d'échec */
function svgPlaceholder(label: string): string {
  const text = label.replace(/[<>&"]/g, "").slice(0, 28);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450">
    <rect width="600" height="450" fill="#1C1917"/>
    <rect x="240" y="160" width="120" height="80" rx="12" fill="#292524" stroke="#44403c" stroke-width="1"/>
    <circle cx="300" cy="200" r="22" fill="#44403c"/>
    <line x1="300" y1="178" x2="300" y2="162" stroke="#78716c" stroke-width="2"/>
    <text x="300" y="278" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" fill="#78716c" font-weight="500">${text}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/** Image produit avec fallback SVG inline garanti */
function ProductImage({ src, alt, categoryName }: { src: string; alt: string; categoryName: string }) {
  const [errored, setErrored] = useState(false);
  const placeholder = svgPlaceholder(categoryName || alt);
  const imgSrc = (!src || errored) ? placeholder : src;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={alt}
      onError={() => !errored && setErrored(true)}
      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
  );
}

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: "fallback-1",
    name: "Kit isolation thermique premium van",
    slug: "kit-isolation-thermique",
    brand: { id: "b1", name: "Isover", slug: "isover", logo: "", logoPng: "", description: "", website: "", isPartner: true, isTrusted: true, activeOffers: 1, categories: [] },
    category: { id: "c1", name: "Isolation", slug: "isolation", icon: "Layers", description: "", productCount: 1 },
    description: "Kit isolation complet pour van aménagé",
    longDescription: "",
    whyThisDeal: "",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=450&fit=crop",
    gallery: [],
    originalPrice: 289,
    promoPrice: 199,
    discount: 31,
    promoCode: "VANZON31",
    offerType: "code_promo",
    affiliateUrl: "",
    isFeatured: true,
    isActive: true,
    priorityScore: 0,
    createdAt: "",
    expiresAt: null,
  },
  {
    id: "fallback-2",
    name: "Panneau solaire monocristallin 200W",
    slug: "panneau-solaire-200w",
    brand: { id: "b2", name: "Renogy", slug: "renogy", logo: "", logoPng: "", description: "", website: "", isPartner: true, isTrusted: true, activeOffers: 1, categories: [] },
    category: { id: "c2", name: "Énergie", slug: "energie", icon: "Zap", description: "", productCount: 1 },
    description: "Panneau solaire flexible haute performance",
    longDescription: "",
    whyThisDeal: "",
    image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=450&fit=crop",
    gallery: [],
    originalPrice: 319,
    promoPrice: 229,
    discount: 28,
    promoCode: "VANZON28",
    offerType: "code_promo",
    affiliateUrl: "",
    isFeatured: true,
    isActive: true,
    priorityScore: 0,
    createdAt: "",
    expiresAt: null,
  },
  {
    id: "fallback-3",
    name: "Batterie lithium 100Ah LiFePO4",
    slug: "batterie-lithium-100ah",
    brand: { id: "b3", name: "Battle Born", slug: "battle-born", logo: "", logoPng: "", description: "", website: "", isPartner: true, isTrusted: true, activeOffers: 1, categories: [] },
    category: { id: "c3", name: "Énergie", slug: "energie", icon: "Battery", description: "", productCount: 1 },
    description: "Batterie lithium longue durée pour van",
    longDescription: "",
    whyThisDeal: "",
    image: "https://images.unsplash.com/photo-1620714223084-8fcacc2dbed5?w=600&h=450&fit=crop",
    gallery: [],
    originalPrice: 699,
    promoPrice: 549,
    discount: 21,
    promoCode: "VANZON21",
    offerType: "code_promo",
    affiliateUrl: "",
    isFeatured: true,
    isActive: true,
    priorityScore: 0,
    createdAt: "",
    expiresAt: null,
  },
];

export default function ClubLandingPage({ previewProducts, allProducts, brands, categories, isLoggedIn = false }: ClubLandingPageProps) {
  const ctaHref  = isLoggedIn ? "/club/deals" : "/sign-up";
  const ctaLabel = isLoggedIn ? "Accéder aux deals" : "Commencer";

  const [activeCategory, setActiveCategory] = useState<string>("tous");
  const [showAll, setShowAll] = useState(false);

  // Onglets intelligents
  const smartTabs = buildSmartTabs(allProducts, categories);

  // Filtrage par catégorie smart, puis diversification
  const filteredProducts = (() => {
    const base = filterBySmartCategory(allProducts, activeCategory);
    const sorted = [...base].sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return b.priorityScore - a.priorityScore;
    });
    return diversifyLocal(sorted, 3).slice(0, 9);
  })();

  const allDisplayProducts = filteredProducts.length > 0
    ? filteredProducts
    : (previewProducts.length > 0 ? previewProducts : FALLBACK_PRODUCTS);

  // Mobile : 3 max / Desktop : 9 max — "Voir plus" révèle le reste
  // On gère ça via CSS classes sur les items au-delà du seuil
  const MOBILE_LIMIT = 3;
  const displayProducts = allDisplayProducts;
  const hasMore = allDisplayProducts.length > MOBILE_LIMIT;

  const calcRef    = useRef(null);
  const dealsRef   = useRef(null);
  const pricingRef = useRef(null);
  const ctaRef     = useRef(null);

  const calcInView    = useInView(calcRef,    { once: true, margin: "-60px" });
  const dealsInView   = useInView(dealsRef,   { once: true, margin: "-60px" });
  const pricingInView = useInView(pricingRef, { once: true, margin: "-60px" });
  const ctaInView     = useInView(ctaRef,     { once: true, margin: "-60px" });

  return (
    <>
      {/* ════════════════════════════════════════════════
          HERO — dark, immersif
      ════════════════════════════════════════════════ */}
      <section className="relative min-h-[92vh] overflow-hidden bg-earth flex flex-col justify-center px-6 pt-24 pb-20">

        {/* Orbes lumineux de fond */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-rust/15 blur-[140px]" />
          <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] rounded-full bg-sage/10 blur-[100px]" />
          <div className="absolute top-0 left-0 w-[300px] h-[300px] rounded-full bg-rust/8 blur-[80px]" />
        </div>

        {/* Grille décorative subtile */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "linear-gradient(rgba(250,247,242,1) 1px, transparent 1px), linear-gradient(90deg, rgba(250,247,242,1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative mx-auto max-w-5xl w-full">
          <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col">

            {/* Badge */}
            <motion.div variants={fadeUp} className="mb-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-cream/12 bg-cream/6 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-cream/50">
                <span className="h-1 w-1 rounded-full bg-rust animate-pulse" />
                Deals vanlife exclusifs
              </span>
            </motion.div>

            {/* Headline principal */}
            <motion.h1
              variants={fadeUp}
              className="font-display text-[clamp(3.2rem,9vw,7.5rem)] leading-[0.88] tracking-[0.03em] text-cream"
            >
              Économise des centaines
              <span
                className="block"
                style={{ WebkitTextStroke: "1px rgba(250,247,242,0.25)", color: "transparent" }}
              >
                sur ton van.
              </span>
            </motion.h1>

            {/* Sous-titre */}
            <motion.p variants={fadeUp} className="mt-8 max-w-md text-base leading-relaxed text-cream/45">
              Codes promo et réductions exclusives de nos marques partenaires, centralisés et vérifiés. Un seul abonnement.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={fadeUp} className="mt-10 flex flex-col sm:flex-row items-start gap-3">
              <Link
                href={ctaHref}
                className="group inline-flex items-center gap-2 rounded-full bg-rust px-7 py-3.5 text-sm font-semibold text-cream transition-all duration-200 hover:bg-rust-dark hover:-translate-y-0.5 active:scale-95"
              >
                {ctaLabel}
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              {!isLoggedIn && (
                <Link
                  href="/sign-in"
                  className="inline-flex items-center gap-2 rounded-full border border-cream/12 px-7 py-3.5 text-sm font-medium text-cream/50 transition-all duration-200 hover:border-cream/25 hover:text-cream/80"
                >
                  J&apos;ai déjà un compte
                </Link>
              )}
            </motion.div>

            {/* Ticker marques partenaires */}
            {brands.length > 0 && (
              <motion.div variants={fadeUp} className="mt-16 -mx-6">
                <p className="px-6 mb-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-cream/20">
                  Marques partenaires
                </p>
                <div className="relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 top-0 z-10 w-24 bg-gradient-to-r from-earth to-transparent pointer-events-none" />
                  <div className="absolute bottom-0 right-0 top-0 z-10 w-24 bg-gradient-to-l from-earth to-transparent pointer-events-none" />
                  {/* Double le tableau pour un défilement fluide infini */}
                  <div className="flex animate-marquee items-center gap-10 py-1" style={{ width: "max-content" }}>
                    {[...Array(8)].flatMap(() => brands).map((brand, i) => (
                      <BrandLogoTicker key={`${brand.id}-${i}`} brand={brand} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          DEALS — blanc, catégories + produits visibles
      ════════════════════════════════════════════════ */}
      <section ref={dealsRef} className="relative overflow-hidden bg-white px-6 py-28">
        <div className="relative mx-auto max-w-5xl">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={dealsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.55 }}
            className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6"
          >
            <div>
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-500 mb-4 block">
                Accès membres
              </span>
              <h2 className="font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.9] tracking-[0.03em] text-earth">
                Des offres exclusives<br />t&apos;attendent.
              </h2>
            </div>
            <Link
              href="/club/deals"
              className="flex-shrink-0 inline-flex items-center gap-2 rounded-full border border-earth/20 px-5 py-2.5 text-xs font-medium text-earth/50 transition-all hover:border-earth/40 hover:text-earth/80"
            >
              Voir tous les deals
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>

          {/* Onglets catégories intelligents */}
          {smartTabs.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={dealsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mb-8 flex flex-wrap gap-2"
            >
              {smartTabs.map((tab) => (
                <button
                  key={tab.slug}
                  onClick={() => setActiveCategory(tab.slug)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
                    activeCategory === tab.slug
                      ? "bg-earth text-cream"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </motion.div>
          )}

          {/* Grille produits */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate={dealsInView ? "visible" : "hidden"}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {displayProducts.map((product, index) => (
              <motion.div
                key={product.id}
                variants={cardIn}
                className={`group relative overflow-hidden rounded-2xl bg-white border border-slate-100 shadow-sm cursor-default${
                  // Mobile : cacher les éléments après le 3e si showAll est false
                  !showAll && index >= MOBILE_LIMIT ? " hidden sm:block" : ""
                }`}
              >
                {/* Image + overlay hover */}
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-50">
                  <ProductImage
                    src={product.image}
                    alt={product.name}
                    categoryName={product.category.name || product.brand.name}
                  />

                  {/* Badge réduction */}
                  {product.discount > 0 && (
                    <span className="absolute left-3 top-3 z-10 rounded-full bg-violet-600 px-2.5 py-1 text-xs font-bold text-white">
                      -{product.discount}%
                    </span>
                  )}

                  {/* Badge catégorie */}
                  {product.category.name && (
                    <span className="absolute right-3 top-3 z-10 rounded-full bg-black/40 backdrop-blur-sm px-2.5 py-1 text-[10px] font-medium text-white/90">
                      {product.category.name}
                    </span>
                  )}

                  {/* Overlay hover — non-membres : rejoindre le club */}
                  {!isLoggedIn && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-md bg-black/65">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-white/10 mb-3">
                        <Lock className="h-5 w-5 text-white" />
                      </div>
                      <p className="text-sm font-semibold text-white">Réservé aux membres</p>
                      <p className="mt-0.5 text-xs text-white/60">9,99€/mois · Sans engagement</p>
                      <Link
                        href="/sign-up"
                        className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-5 py-2 text-xs font-semibold text-white transition-colors hover:bg-violet-700 active:scale-95"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Rejoindre le club
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  )}
                </div>

                {/* Infos produit */}
                <div className="bg-white px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{product.brand.name}</p>
                  <h3 className="mt-0.5 text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{product.name}</h3>

                  <div className="mt-2 flex items-baseline gap-2">
                    {product.promoPrice > 0 ? (
                      <>
                        <span className="text-base font-bold text-violet-600">{product.promoPrice.toFixed(2)}€</span>
                        {product.originalPrice > product.promoPrice && (
                          <span className="text-xs text-red-400 line-through">{product.originalPrice.toFixed(2)}€</span>
                        )}
                        {product.originalPrice > product.promoPrice && (
                          <span className="ml-auto text-xs font-semibold text-emerald-500">
                            -{(product.originalPrice - product.promoPrice).toFixed(2)}€
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-sm font-semibold text-violet-600">Offre exclusive</span>
                    )}
                  </div>

                  {/* Membres connectés : code promo + bouton voir l'offre */}
                  {isLoggedIn && (
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      {product.promoCode && (
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 border border-violet-200 px-3 py-1.5 text-xs font-mono font-bold text-violet-700">
                          <Tag className="h-3 w-3" />
                          {product.promoCode}
                        </span>
                      )}
                      {product.affiliateUrl && product.affiliateUrl !== "/" && (
                        <Link
                          href={product.affiliateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-auto inline-flex items-center gap-1 rounded-full bg-earth px-3 py-1.5 text-[11px] font-semibold text-cream hover:opacity-80 transition-opacity"
                        >
                          Voir l&apos;offre
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  )}

                  {/* Non-membres : placeholder code verrouillé statique */}
                  {!isLoggedIn && (
                    <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 w-fit">
                      <Lock className="h-3 w-3 text-slate-400 flex-shrink-0" />
                      <span className="text-xs font-mono font-bold text-slate-400 select-none tracking-widest">
                        ••••••••
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Bouton Voir plus — mobile uniquement (sm: masqué car grille reprend) */}
          {hasMore && !showAll && (
            <div className="mt-6 flex justify-center sm:hidden">
              <button
                onClick={() => setShowAll(true)}
                className="inline-flex items-center gap-2 rounded-full border border-earth/30 bg-earth/5 px-6 py-2.5 text-sm font-semibold text-earth/80 transition-all hover:bg-earth/10 hover:border-earth/50"
              >
                Voir plus
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* CTA bas de section */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={dealsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-10 text-center"
          >
            <Link
              href="/club/deals"
              className="group inline-flex items-center gap-2 rounded-full bg-earth px-7 py-3 text-sm font-semibold text-cream transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
            >
              Voir tous les deals
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            {!isLoggedIn && (
              <p className="mt-3 text-xs text-slate-400">
                Codes promo réservés aux membres · <Link href="/sign-up" className="text-violet-500 hover:underline">S&apos;inscrire pour 9,99€/mois</Link>
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          LE CALCUL EST SIMPLE — dark earth (même DA que le Hero)
      ════════════════════════════════════════════════ */}
      <section ref={calcRef} className="relative overflow-hidden bg-earth px-6 py-28">

        {/* Orbes lumineux */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-rust/12 blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-[350px] h-[350px] rounded-full bg-sage/8 blur-[100px]" />
          <div className="absolute top-0 right-1/4 w-[250px] h-[250px] rounded-full bg-rust/6 blur-[80px]" />
        </div>

        {/* Grille décorative subtile */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "linear-gradient(rgba(250,247,242,1) 1px, transparent 1px), linear-gradient(90deg, rgba(250,247,242,1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative mx-auto max-w-5xl">
          <div className="grid gap-16 lg:grid-cols-[1fr_1.1fr] lg:items-center">

            {/* Gauche — grand chiffre */}
            <motion.div
              variants={fadeLeft}
              initial="hidden"
              animate={calcInView ? "visible" : "hidden"}
            >
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-rust mb-6 block">
                Le calcul est simple
              </span>
              <div className="font-display text-[clamp(5rem,14vw,9rem)] leading-none tracking-wide text-cream">
                9,99€
              </div>
              <div className="font-display text-xl tracking-wide text-cream/40 mt-1">/mois</div>
              <div className="mt-8 h-px w-12 bg-cream/20" />
              <p className="mt-8 max-w-xs text-sm leading-relaxed text-cream/55">
                Un aménagement van coûte entre 3 000€ et 15 000€. Nos deals te font économiser en moyenne{" "}
                <strong className="text-cream font-semibold">10 à 30%</strong> sur chaque achat auprès de nos partenaires.
              </p>
              <p className="mt-3 text-xs text-cream/25">Résiliable à tout moment · Sans engagement</p>
            </motion.div>

            {/* Droite — features */}
            <motion.div
              variants={stagger}
              initial="hidden"
              animate={calcInView ? "visible" : "hidden"}
              className="flex flex-col gap-3"
            >
              {[
                {
                  icon: Tag,
                  title: "Codes promo vérifiés",
                  desc: "Chaque code est testé avant publication. Plus de chasses aux bons plans — tout est centralisé.",
                },
                {
                  icon: RefreshCw,
                  title: "Mis à jour quotidiennement",
                  desc: "Nouveaux deals chaque semaine. Alertes prix pour ne jamais rater une offre.",
                },
                {
                  icon: ShieldCheck,
                  title: "Marques sélectionnées",
                  desc: "Seules les marques reconnues par la communauté vanlife intègrent notre catalogue.",
                },
              ].map((item) => (
                <motion.div
                  key={item.title}
                  variants={cardIn}
                  className="group flex items-start gap-4 rounded-2xl border border-cream/10 bg-cream/6 p-5 transition-all duration-200 hover:bg-cream/10 hover:border-cream/20"
                >
                  <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-rust/20 transition-colors group-hover:bg-rust/30">
                    <item.icon className="h-4 w-4 text-rust" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-cream">{item.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-cream/50">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          PRICING — cream
      ════════════════════════════════════════════════ */}
      <section ref={pricingRef} className="bg-cream px-6 py-28">
        <div className="mx-auto max-w-sm">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={pricingInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="relative overflow-hidden rounded-3xl bg-earth px-10 py-12"
          >
            {/* Glow interne */}
            <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-56 h-40 bg-rust/25 blur-[60px]" />

            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rust mb-8 text-center">
                Accès complet
              </p>

              <div className="flex items-end justify-center gap-1 mb-1">
                <span className="font-display text-[5.5rem] leading-none tracking-wide text-cream">9,99€</span>
                <span className="mb-3 text-base text-cream/30">/mois</span>
              </div>
              <p className="text-xs text-cream/30 text-center mb-10">
                0,33€/jour · Résiliable à tout moment
              </p>

              <ul className="flex flex-col gap-3 mb-10">
                {[
                  "Tous les deals & codes promo",
                  "Alertes prix illimitées",
                  "Offres favorites sauvegardées",
                  "Nouveaux deals chaque semaine",
                  "Mis à jour quotidiennement",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-cream/55">
                    <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-rust/20">
                      <svg className="h-2.5 w-2.5 text-rust" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={ctaHref}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-rust px-8 py-3.5 text-sm font-semibold text-cream transition-all duration-200 hover:bg-rust-dark hover:-translate-y-0.5 active:scale-95"
              >
                {ctaLabel}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <p className="mt-4 text-center text-xs text-cream/20">Sans engagement · Résiliation en 1 clic</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          CTA FINAL — dark
      ════════════════════════════════════════════════ */}
      <section ref={ctaRef} className="relative overflow-hidden bg-earth px-6 py-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute bottom-0 left-0 w-[450px] h-[350px] rounded-full bg-rust/12 blur-[110px]" />
          <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-sage/8 blur-[90px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={ctaInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65 }}
          className="relative mx-auto max-w-3xl text-center"
        >
          <h2 className="font-display text-[clamp(2.8rem,7vw,5.5rem)] leading-[0.9] tracking-[0.03em] text-cream mb-6">
            Arrête de payer plein pot<br />
            <span style={{ WebkitTextStroke: "1px rgba(250,247,242,0.2)", color: "transparent" }}>
              ton aménagement van.
            </span>
          </h2>
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-cream/35 mb-10">
            Pour 9,99€/mois, accède aux meilleures réductions négociées directement avec nos marques partenaires.
          </p>
          <Link
            href={ctaHref}
            className="group inline-flex items-center gap-2 rounded-full bg-rust px-9 py-4 text-base font-semibold text-cream transition-all duration-200 hover:bg-rust-dark hover:-translate-y-0.5 active:scale-95"
          >
            {ctaLabel}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <p className="mt-5 text-xs text-cream/20">Sans engagement · Résiliation en 1 clic</p>
        </motion.div>
      </section>

      <OtherServices current="club" bgColor="#F8FAFC" />
    </>
  );
}
