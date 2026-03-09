"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import type { SanityArticle } from "../types";

type Category = "Tous" | "Road Trips" | "Aménagement Van" | "Business Van" | "Achat Van";

const CATEGORIES: { label: Category; icon: string }[] = [
  { label: "Tous", icon: "✦" },
  { label: "Road Trips", icon: "🗺️" },
  { label: "Aménagement Van", icon: "🔧" },
  { label: "Business Van", icon: "💼" },
  { label: "Achat Van", icon: "🔑" },
];

const CATEGORY_COLOR: Record<string, string> = {
  "Road Trips": "bg-blue-50 text-blue-700",
  "Aménagement Van": "bg-emerald-50 text-emerald-700",
  "Business Van": "bg-amber-50 text-amber-700",
  "Achat Van": "bg-violet-50 text-violet-700",
};

type MappedArticle = {
  slug: string;
  title: string;
  description: string;
  category: Exclude<Category, "Tous">;
  image: string;
  imageAlt: string;
  readTime: string | null;
  href: string;
  featured: boolean;
  tag?: string;
};

function ArticleCard({ article, index }: { article: MappedArticle; index: number }) {
  return (
    <div className="animate-fade-in" style={{ animationDelay: `${index * 40}ms`, animationFillMode: "both" }}>
      <Link
        href={article.href}
        className="group relative flex flex-col rounded-2xl overflow-hidden border border-slate-100 bg-white hover:border-[#4D5FEC]/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
      >
        {/* Image */}
        <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
          <Image
            src={article.image}
            alt={article.imageAlt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
          <div className="absolute top-3 left-3 flex gap-2">
            {article.tag && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/95 text-slate-800 backdrop-blur-sm">
                {article.tag}
              </span>
            )}
          </div>
          {article.readTime && (
            <div className="absolute bottom-3 right-3 text-xs font-medium text-white/90 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full">
              {article.readTime} de lecture
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-5">
          <span className={`self-start text-xs font-semibold px-2.5 py-1 rounded-full mb-3 ${CATEGORY_COLOR[article.category]}`}>
            {article.category}
          </span>
          <h3 className="font-black text-slate-900 text-base leading-snug mb-2 flex-1 group-hover:text-[#4D5FEC] transition-colors duration-200">
            {article.title}
          </h3>
          <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-4">
            {article.description}
          </p>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold mt-auto transition-all" style={{ color: "#4D5FEC" }}>
            Lire l&apos;article
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </span>
        </div>
      </Link>
    </div>
  );
}

export default function ArticlesPageClient({ sanityArticles = [] }: { sanityArticles: SanityArticle[] }) {
  const [activeCategory, setActiveCategory] = useState<Category>("Tous");

  const articles = useMemo<MappedArticle[]>(() =>
    sanityArticles.map((a) => ({
      slug: a.slug,
      title: a.title,
      description: a.excerpt,
      category: a.category,
      image: a.coverImage?.url ?? "https://cdn.sanity.io/images/lewexa74/production/f93fa16ab46d8934dcc3092a8e86fc80ebce4305-1080x750.png",
      imageAlt: a.coverImage?.alt ?? a.title,
      readTime: a.readTime ?? null,
      href: `/articles/${a.slug}`,
      featured: a.featured ?? false,
      tag: a.tag,
    })),
    [sanityArticles]
  );

  const featuredArticle = articles.find((a) => a.featured);

  const filteredArticles = useMemo(() => {
    const nonFeatured = activeCategory === "Tous"
      ? articles.filter((a) => !a.featured)
      : articles.filter((a) => a.category === activeCategory);
    return nonFeatured;
  }, [articles, activeCategory]);

  const countByCategory = (cat: Category) =>
    cat === "Tous" ? articles.length : articles.filter((a) => a.category === cat).length;

  return (
    <>
      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden pt-10 pb-0"
        style={{ background: "linear-gradient(160deg, #0F153A 0%, #1e2860 50%, #0c1233 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-10 pb-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 border border-white/15 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#4BC3E3] animate-pulse" />
              <span className="text-white/70 text-xs font-semibold uppercase tracking-widest">Vanzon Explorer · Magazine</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-5">
              Guides & Articles<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4BC3E3] to-[#4D5FEC]">Vanlife &amp; Pays Basque</span>
            </h1>
            <p className="text-white/60 text-xl leading-relaxed max-w-xl mb-8">
              Itinéraires, spots secrets, conseils pratiques et culture basque — tout ce qu&apos;il faut pour vivre le Pays Basque en van comme un local.
            </p>
            {articles.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-white/70 text-sm">
                  {articles.length} article{articles.length > 1 ? "s" : ""} disponible{articles.length > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="relative h-10 overflow-hidden">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-0 w-full" preserveAspectRatio="none">
            <path d="M0 40 L0 20 Q360 0 720 20 Q1080 40 1440 10 L1440 40 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── ARTICLE À LA UNE ──────────────────────────────────────── */}
      {featuredArticle && activeCategory === "Tous" && (
        <section className="bg-white pt-10 pb-0">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-px bg-slate-200" />
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Article à la une</span>
            </div>
            <Link href={featuredArticle.href} className="group block">
              <div className="relative rounded-3xl overflow-hidden border border-slate-100 hover:border-[#4D5FEC]/30 transition-all duration-300 hover:shadow-2xl">
                <div className="grid md:grid-cols-2 min-h-[400px]">
                  <div className="relative min-h-[260px] md:min-h-0">
                    <Image
                      src={featuredArticle.image}
                      alt={featuredArticle.imageAlt}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      unoptimized
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white hidden md:block" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent md:hidden" />
                  </div>
                  <div className="flex flex-col justify-center p-8 md:p-12 bg-white">
                    <div className="flex items-center gap-3 mb-5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLOR[featuredArticle.category]}`}>
                        {featuredArticle.category}
                      </span>
                      {featuredArticle.tag && (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                          {featuredArticle.tag}
                        </span>
                      )}
                      {featuredArticle.readTime && (
                        <span className="text-xs text-slate-400">{featuredArticle.readTime} de lecture</span>
                      )}
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-snug mb-4 group-hover:text-[#4D5FEC] transition-colors duration-200">
                      {featuredArticle.title}
                    </h2>
                    <p className="text-slate-500 leading-relaxed mb-8 text-base">{featuredArticle.description}</p>
                    <div className="inline-flex items-center gap-2 text-base font-bold transition-colors" style={{ color: "#4D5FEC" }}>
                      Lire l&apos;article complet
                      <svg className="w-5 h-5 transition-transform group-hover:translate-x-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ── FILTRES ───────────────────────────────────────────────── */}
      <section className="bg-white pt-14 pb-0">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-8 h-px bg-slate-200" />
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Parcourir par thème</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map(({ label, icon }) => {
              const isActive = activeCategory === label;
              const count = countByCategory(label);
              return (
                <button
                  key={label}
                  onClick={() => setActiveCategory(label)}
                  className={`group flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-[#4D5FEC] text-white border-[#4D5FEC] shadow-md shadow-[#4D5FEC]/20"
                      : "bg-white text-slate-600 border-slate-200 hover:border-[#4D5FEC]/40 hover:text-[#4D5FEC] hover:bg-blue-50/50"
                  }`}
                >
                  <span className="text-base leading-none">{icon}</span>
                  <span>{label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold transition-colors ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-8 h-px bg-slate-100" />
        </div>
      </section>

      {/* ── GRILLE ────────────────────────────────────────────────── */}
      <section className="bg-white py-10 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <p className="text-sm text-slate-400">
              <span className="font-semibold text-slate-700">{filteredArticles.length}</span> article{filteredArticles.length > 1 ? "s" : ""}
              {activeCategory !== "Tous" && (
                <span className="ml-1">dans <span className="font-medium text-slate-600">{activeCategory}</span></span>
              )}
            </p>
            {activeCategory !== "Tous" && (
              <button
                onClick={() => setActiveCategory("Tous")}
                className="text-xs text-slate-400 hover:text-[#4D5FEC] transition-colors flex items-center gap-1 font-medium"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Réinitialiser
              </button>
            )}
          </div>

          {filteredArticles.length > 0 ? (
            <div key={activeCategory} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article, i) => (
                <ArticleCard key={article.slug} article={article} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-24 animate-fade-in">
              <div className="text-5xl mb-4">📝</div>
              <p className="text-slate-400 text-lg font-medium">
                {articles.length === 0
                  ? "Les premiers articles arrivent bientôt."
                  : "Aucun article dans cette catégorie pour l'instant."}
              </p>
              {articles.length > 0 && (
                <button
                  onClick={() => setActiveCategory("Tous")}
                  className="mt-4 text-sm font-semibold transition-colors"
                  style={{ color: "#4D5FEC" }}
                >
                  Voir tous les articles →
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA BAS DE PAGE ───────────────────────────────────────── */}
      <section className="py-20 border-t border-slate-100" style={{ background: "linear-gradient(160deg, #EFF6FF 0%, #F0FDFF 100%)" }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="text-4xl mb-5">🚐</div>
          <h2 className="text-3xl font-black text-slate-900 mb-3">Prêt à vivre l&apos;aventure ?</h2>
          <p className="text-slate-500 text-lg leading-relaxed mb-8 max-w-xl mx-auto">
            Louer un van aménagé au Pays Basque, c&apos;est la liberté totale — sans les contraintes de la propriété.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/location"
              className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white font-bold px-8 py-4 rounded-xl hover:bg-slate-800 transition-colors text-base shadow-lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="8" x="2" y="13" rx="2" />
                <path d="M6 13V8a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v5" />
              </svg>
              Louer un van aménagé
            </Link>
            <Link
              href="/formation"
              className="inline-flex items-center justify-center gap-2 border border-slate-200 bg-white text-slate-700 font-bold px-8 py-4 rounded-xl hover:border-[#4D5FEC]/40 hover:text-[#4D5FEC] transition-colors text-base"
            >
              Découvrir la formation →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
