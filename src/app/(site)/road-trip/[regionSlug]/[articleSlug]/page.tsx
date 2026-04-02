import { Metadata } from "next";
import { notFound } from "next/navigation";
import { sanityFetch } from "@/lib/sanity/client";
import { getRoadTripArticleBySlugQuery, getAllRoadTripArticleSlugsQuery } from "@/lib/sanity/queries";
import { PortableText } from "@portabletext/react";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import DaySection from "../../_components/DaySection";
import RelatedItineraries from "../../_components/RelatedItineraries";
import RoadTripSimilarCTA from "../../_components/RoadTripSimilarCTA";
import { TouristTripJsonLd, RoadTripFAQJsonLd, OrganizationJsonLd } from "@/components/seo/JsonLd";
import dynamic from "next/dynamic";

const ArticleMap = dynamic(() => import("../../_components/ArticleMap"), { ssr: false });

interface Props {
  params: { regionSlug: string; articleSlug: string };
}

interface RoadTripArticle {
  _id: string;
  title: string;
  slug: string;
  regionSlug: string;
  regionName: string;
  seoTitle?: string;
  seoDescription?: string;
  chapeau?: string;
  excerpt?: string;
  duree?: number;
  style?: string;
  profil?: string;
  periode?: string;
  interets?: string[];
  intro?: unknown[];
  jours?: Array<{
    numero: number;
    titre: string;
    tips?: string;
    spots?: Array<{ nom: string; description?: string; type?: string; mapsUrl?: string; wikiExcerpt?: string; wikiUrl?: string; photo?: { url: string; alt: string; credit?: string }; lat?: number; lon?: number }>;
    camping?: { nom?: string; mapsUrl?: string; options?: string[] };
    restaurant?: { nom?: string; type?: string; specialite?: string };
  }>;
  conseilsPratiques?: string[];
  faqItems?: Array<{ question: string; answer: string }>;
  enResume?: string[];
  geojson?: string;
  publishedAt?: string;
  coverImage?: { url: string; alt: string; credit?: string };
  relatedArticles?: Array<{ _id: string; title: string; slug: string; regionSlug: string; regionName: string; duree?: number; style?: string; coverImage?: { url: string; alt: string } }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await sanityFetch<RoadTripArticle>(getRoadTripArticleBySlugQuery, {
    regionSlug: params.regionSlug,
    articleSlug: params.articleSlug,
  });
  if (!article) return { title: "Itinéraire non trouvé" };

  return {
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt,
    openGraph: {
      title: article.seoTitle || article.title,
      description: article.seoDescription || "",
      type: "article",
      images: article.coverImage?.url ? [{ url: article.coverImage.url, alt: article.coverImage.alt }] : [],
    },
    alternates: {
      canonical: `https://vanzonexplorer.com/road-trip/${params.regionSlug}/${params.articleSlug}`,
    },
    other: {
      "robots": "max-snippet:-1, max-image-preview:large",
    },
  };
}

export async function generateStaticParams() {
  const slugs = await sanityFetch<Array<{ regionSlug: string; articleSlug: string }>>(getAllRoadTripArticleSlugsQuery) ?? [];
  return slugs.map(({ regionSlug, articleSlug }) => ({ regionSlug, articleSlug }));
}

export default async function RoadTripArticlePage({ params }: Props) {
  const article = await sanityFetch<RoadTripArticle>(getRoadTripArticleBySlugQuery, {
    regionSlug: params.regionSlug,
    articleSlug: params.articleSlug,
  });

  if (!article) notFound();

  return (
    <main className="min-h-screen bg-bg-primary">
      {/* JSON-LD */}
      <TouristTripJsonLd
        name={article.seoTitle || article.title}
        description={article.seoDescription || article.excerpt || ""}
        url={`https://vanzonexplorer.com/road-trip/${params.regionSlug}/${params.articleSlug}`}
        image={article.coverImage?.url}
        region={article.regionName || params.regionSlug}
        duration={article.duree || 5}
      />
      {article.faqItems && article.faqItems.length > 0 && (
        <RoadTripFAQJsonLd items={article.faqItems} />
      )}
      <OrganizationJsonLd />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <Breadcrumbs items={[
          { label: "Accueil", href: "/" },
          { label: "Road Trips", href: "/road-trip" },
          { label: article.regionName || params.regionSlug, href: `/road-trip/${params.regionSlug}` },
          { label: article.title },
        ]} />

        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-wrap gap-2 mb-3">
            {article.duree && <span className="badge-glass text-xs px-3 py-1">{article.duree} jours</span>}
            {article.style && <span className="badge-glass text-xs px-3 py-1 capitalize">{article.style}</span>}
            {article.profil && <span className="badge-glass text-xs px-3 py-1 capitalize">{article.profil}</span>}
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">{article.seoTitle || article.title}</h1>
          {article.chapeau && (
            <p className="text-lg text-slate-600 leading-relaxed border-l-4 border-accent-blue pl-4 speakable">
              {article.chapeau}
            </p>
          )}
        </header>

        {/* Carte */}
        <ArticleMap geojson={article.geojson} regionName={article.regionName} />

        {/* Intro */}
        {article.intro && (
          <div className="prose prose-slate max-w-none mb-10">
            <PortableText value={article.intro as Parameters<typeof PortableText>[0]["value"]} />
          </div>
        )}

        {/* Jours */}
        {article.jours && article.jours.map((jour, idx) => (
          <div key={idx}>
            <DaySection {...jour} />
            {/* CTA mid-article au jour 3 */}
            {idx === 2 && (
              <RoadTripSimilarCTA region={article.regionSlug} duree={article.duree} style={article.style} />
            )}
          </div>
        ))}

        {/* Conseils pratiques */}
        {article.conseilsPratiques && article.conseilsPratiques.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4">Conseils pratiques</h2>
            <ul className="space-y-2">
              {article.conseilsPratiques.map((conseil, i) => (
                <li key={i} className="flex gap-3 text-slate-600 text-sm">
                  <span className="text-accent-blue shrink-0">✓</span>
                  {conseil}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* FAQ */}
        {article.faqItems && article.faqItems.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-black text-slate-900 mb-4">FAQ</h2>
            <div className="space-y-4">
              {article.faqItems.map((faq, i) => (
                <details key={i} className="glass-card rounded-xl p-4 group">
                  <summary className="font-semibold text-slate-900 cursor-pointer list-none flex justify-between items-center">
                    {faq.question}
                    <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="mt-3 text-slate-600 text-sm leading-relaxed speakable">{faq.answer}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {/* En résumé */}
        {article.enResume && article.enResume.length > 0 && (
          <section className="glass-card rounded-2xl p-6 mb-10">
            <h2 className="text-xl font-black text-slate-900 mb-4">En résumé</h2>
            <ul className="space-y-2">
              {article.enResume.map((bullet, i) => (
                <li key={i} className="flex gap-3 text-slate-600 text-sm">
                  <span className="text-green-500 shrink-0">✓</span>
                  {bullet}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* CTA final */}
        <RoadTripSimilarCTA region={article.regionSlug} duree={article.duree} style={article.style} />

        {/* Articles similaires */}
        {article.relatedArticles && <RelatedItineraries articles={article.relatedArticles} />}
      </div>
    </main>
  );
}
