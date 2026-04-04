import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { sanityFetch } from "@/lib/sanity/client";
import {
  getArticleBySlugQuery,
  getAllArticleSlugsQuery,
  getRelatedArticlesQuery,
} from "@/lib/sanity/queries";
import { ArticleJsonLd, type FAQItem } from "@/components/seo/JsonLd";
import ArticleTOC from "./_components/ArticleTOC";
import ReadingProgressBar from "./_components/ReadingProgressBar";
import ArticleFAQ from "./_components/ArticleFAQ";
import ArticleCategorySync from "./_components/ArticleCategorySync";
import ShareButton from "./_components/ShareButton";
import RoadTripCTA from "@/components/ui/RoadTripCTA";
import {
  extractHeadings,
  extractFAQ,
  contentBeforeFAQ,
  contentAfterFAQ,
  splitBySections,
  categoryColorMap,
  formatDate,
  type PortableBlock,
  type TOCHeading,
} from "@/lib/article-utils";
import { makePortableComponents, renderBlocks } from "@/components/article/PortableTextComponents";
import { SectionCTA } from "@/components/article/SectionCTA";

// ── Types ──────────────────────────────────────────────────────────────────────

type ArticleDoc = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tag?: string;
  readTime?: string;
  publishedAt: string;
  updatedAt?: string;
  featured: boolean;
  content?: PortableBlock[];
  seoTitle?: string;
  seoDescription?: string;
  coverImage?: {
    url: string;
    alt?: string;
    credit?: string;
    pexelsUrl?: string;
    width?: number;
    height?: number;
  } | null;
};

type RelatedArticle = {
  _id: string;
  title: string;
  slug: string;
  category: string;
  readTime?: string;
};

// ── Static generation ──────────────────────────────────────────────────────────

export async function generateStaticParams() {
  const slugs = await sanityFetch<{ slug: string }[]>(getAllArticleSlugsQuery);
  return (slugs ?? []).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const article = await sanityFetch<ArticleDoc>(getArticleBySlugQuery, {
    slug: params.slug,
  });
  if (!article) return {};
  const siteUrl = "https://vanzonexplorer.com";
  const hasContent = Array.isArray(article.content) && article.content.length > 0;
  return {
    title: article.seoTitle ?? `${article.title} | Vanzon Explorer`,
    description: article.seoDescription ?? article.excerpt,
    ...(!hasContent && { robots: { index: false, follow: false } }),
    alternates: {
      canonical: `${siteUrl}/articles/${article.slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.seoDescription ?? article.excerpt,
      images: article.coverImage?.url ? [{ url: article.coverImage.url }] : [],
      type: "article",
      publishedTime: article.publishedAt,
      ...(article.updatedAt ? { modifiedTime: article.updatedAt } : {}),
      authors: ["Jules Gaveglio", "Elio"],
      locale: "fr_FR",
    },
  };
}

// ── Cover image slugs with natural ratio ──────────────────────────────────────

const NATURAL_RATIO_SLUGS = [
  "pourquoi-la-vanlife-a-besoin-dun-label-aujourdhui-et-la-vision-derriere-label-vanlife",
  "la-labellisation-des-lieux-vanlife-cest-quoi-concretement-et-comment-ca-marche",
  "la-carte-membre-vanlife-comment-ca-marche-et-quels-avantages-concrets",
];

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function ArticleDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const article = await sanityFetch<ArticleDoc>(getArticleBySlugQuery, { slug: params.slug });
  if (!article) notFound();
  const relatedArticles = await sanityFetch<RelatedArticle[]>(getRelatedArticlesQuery, {
    slug: params.slug,
    category: article.category,
  });

  const content = article.content ?? [];
  const headings = extractHeadings(content);
  const faqItems = extractFAQ(content);
  const contentForBody = contentBeforeFAQ(content);
  const conclusionContent = contentAfterFAQ(content);
  const sections = splitBySections(contentForBody);

  const faqHeading = headings.find(
    (h) => h.text.toLowerCase().includes("faq") || h.text.toLowerCase().includes("question")
  );

  const headingIds = new Map(headings.map((h) => [h.text, h.id]));
  const portableComponents = makePortableComponents(headingIds);

  return (
    <main className="min-h-screen bg-white">
      <ReadingProgressBar />
      <ArticleCategorySync category={article.category} />
      <ArticleJsonLd article={{ ...article, updatedAt: article.updatedAt }} faqItems={faqItems} />

      {/* ── Hero cover image ── */}
      {article.coverImage?.url && (() => {
        const useNaturalRatio = NATURAL_RATIO_SLUGS.includes(article.slug);
        const { width, height } = article.coverImage;

        if (useNaturalRatio && width && height) {
          return (
            <div className="w-full bg-slate-100 flex justify-center">
              <div className="w-full max-w-[1120px] px-4 sm:px-6 pt-8">
                <Image
                  src={article.coverImage.url}
                  alt={article.coverImage.alt ?? article.title}
                  width={width}
                  height={height}
                  className="w-full h-auto rounded-2xl object-contain"
                  priority
                />
              </div>
            </div>
          );
        }

        return (
          <div className="relative w-full h-[55vh] min-h-[340px] max-h-[560px] bg-slate-100">
            <Image
              src={article.coverImage.url}
              alt={article.coverImage.alt ?? article.title}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/20 to-transparent" />
            {article.coverImage.credit && (
              <p className="absolute bottom-3 right-4 text-white/65 text-xs bg-black/20 backdrop-blur-sm px-2 py-0.5 rounded-full">
                {article.coverImage.credit}
              </p>
            )}
          </div>
        );
      })()}

      {/* ── Two-column layout ── */}
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-12 lg:grid lg:grid-cols-[1fr_272px] lg:gap-16 lg:items-start">

        {/* ── Main content ── */}
        <article className="min-w-0 max-w-[750px]">

          {/* Breadcrumb */}
          <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-sm text-slate-400 mb-8">
            <Link href="/" className="hover:text-[#4D5FEC] transition-colors">Accueil</Link>
            <span aria-hidden>/</span>
            <Link href="/articles" className="hover:text-[#4D5FEC] transition-colors">Articles</Link>
            <span aria-hidden>/</span>
            <span className="text-slate-600 truncate max-w-[200px]">{article.title}</span>
          </nav>

          {/* Meta badges */}
          <div className="flex flex-wrap items-center gap-2.5 mb-6">
            <span
              className={`text-xs font-bold px-3 py-1.5 rounded-full ${categoryColorMap[article.category] ?? "bg-slate-100 text-slate-600"}`}
            >
              {article.category}
            </span>
            {article.tag && (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700">
                {article.tag}
              </span>
            )}
            {article.readTime && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                </svg>
                {article.readTime} de lecture
              </span>
            )}
            <span className="text-xs text-slate-400">{formatDate(article.publishedAt)}</span>
            <div className="ml-auto">
              <ShareButton />
            </div>
          </div>

          {/* H1 */}
          <h1 className="text-3xl md:text-[2.35rem] font-black text-slate-900 leading-tight tracking-tight mb-6">
            {article.title}
          </h1>

          {/* PAS intro */}
          <div className="relative pl-5 border-l-4 border-[#4D5FEC] bg-blue-50/40 py-5 pr-5 rounded-r-2xl mb-10">
            <p className="text-[17px] text-slate-700 leading-[1.75] font-[450]">
              {article.excerpt}
            </p>
          </div>

          {/* Inline TOC */}
          {headings.filter((h: TOCHeading) => h.level === 2).length > 1 && (
            <nav aria-label="Sommaire" className="my-8 p-5 rounded-2xl border border-slate-100 bg-slate-50/60">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">📋 Dans cet article</p>
              <ol className="space-y-2">
                {headings.filter((h: TOCHeading) => h.level === 2).map((h: TOCHeading, i: number) => (
                  <li key={h.id} className="flex items-start gap-3">
                    <span className="text-xs font-bold text-[#4D5FEC]/60 mt-0.5 flex-shrink-0 w-5">{i + 1}.</span>
                    <a href={`#${h.id}`} className="text-sm text-slate-600 hover:text-[#4D5FEC] transition-colors leading-snug">
                      {h.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          )}

          {/* ── Article body with CTA injection ── */}
          {content.length > 0 ? (
            <div>
              {sections.map((section, i) => (
                <div key={i}>
                  {renderBlocks(section, portableComponents)}
                  {i % 2 === 1 && i < sections.length - 2 && (
                    <SectionCTA index={Math.floor(i / 2)} />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 italic">Contenu de l&apos;article à venir.</p>
          )}

          {/* ── FAQ accordion ── */}
          {faqHeading && (
            <div id={faqHeading.id} className="scroll-mt-24" />
          )}
          <ArticleFAQ faqItems={faqItems} />

          {/* ── Conclusion (contenu après FAQ) ── */}
          {conclusionContent.length > 0 && (
            <div>{renderBlocks(conclusionContent, portableComponents)}</div>
          )}

          {/* ── Auteurs ── */}
          <div className="mt-14 pt-10 border-t border-slate-100">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">À propos des auteurs</p>
            <div className="glass-card p-5">
              <div className="flex items-start gap-4">
                <div className="flex -space-x-3 flex-shrink-0">
                  <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-white shadow-sm">
                    <Image
                      src="https://cdn.sanity.io/images/lewexa74/production/16f9120e659bdd4bba47e663e9df9a1a9293fe3f-1170x2080.jpg?auto=format&q=82"
                      alt="Jules Gaveglio — Co-fondateur Vanzon Explorer"
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  </div>
                  <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-white shadow-sm">
                    <Image
                      src="https://cdn.sanity.io/images/lewexa74/production/325f3ebf1d68fd890487229864c73cc65bef20d3-1186x1654.png?auto=format&q=82"
                      alt="Elio — Co-fondateur Vanzon Explorer"
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm leading-none mb-1">Jules & Elio</p>
                  <p className="text-xs text-[#4D5FEC] font-semibold mb-2">Co-fondateurs · Vanzon Explorer</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Passionnés de vanlife et du Pays Basque depuis 2022. Ils ont aménagé leur flotte de vans, lancé la location et créé la Van Business Academy — ils partagent ici tout ce qu&apos;ils ont appris sur le terrain.
                  </p>
                  <Link href="/a-propos" className="text-xs font-semibold text-[#4D5FEC] hover:underline mt-2 inline-block">
                    En savoir plus →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* ── Articles similaires ── */}
          {relatedArticles && relatedArticles.length > 0 && (
            <div className="mt-10 pt-8 border-t border-slate-100">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">
                Articles similaires
              </h2>
              <ul className="space-y-3">
                {relatedArticles.map((a) => (
                  <li key={a._id}>
                    <Link
                      href={`/articles/${a.slug}`}
                      className="group flex items-start gap-3 text-sm text-slate-600 hover:text-[#4D5FEC] transition-colors"
                    >
                      <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-[#4D5FEC]/40 flex-shrink-0 group-hover:bg-[#4D5FEC] transition-colors" />
                      {a.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Road Trip CTA ── */}
          <RoadTripCTA />

          {/* ── Footer CTA ── */}
          <div className="mt-12 pt-10 border-t border-slate-100">
            <p className="text-sm font-semibold text-slate-500 mb-5">Envie d&apos;aller plus loin ?</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/location"
                className="btn-primary btn-shine inline-flex items-center justify-center gap-2 text-sm"
              >
                <span className="flex flex-col items-start leading-tight">
                  <span>🚐 Louer un van au Pays Basque</span>
                  <span className="text-[11px] font-normal opacity-80">Disponible dès 65€/nuit</span>
                </span>
              </Link>
              <Link
                href="/articles"
                className="btn-ghost inline-flex items-center justify-center gap-2 text-sm"
              >
                ← Tous les articles
              </Link>
            </div>
          </div>
        </article>

        {/* ── Sticky TOC sidebar ── */}
        <ArticleTOC headings={headings} />
      </div>
    </main>
  );
}
