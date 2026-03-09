import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { PortableText } from "@portabletext/react";
import { sanityFetch } from "@/lib/sanity/client";
import {
  getArticleBySlugQuery,
  getAllArticleSlugsQuery,
  getRelatedArticlesQuery,
} from "@/lib/sanity/queries";
import { ArticleJsonLd, type FAQItem } from "@/components/seo/JsonLd";
import ArticleTOC, { type TOCHeading } from "./_components/ArticleTOC";

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
  featured: boolean;
  content?: PortableBlock[];
  seoTitle?: string;
  seoDescription?: string;
  coverImage?: { url: string; alt?: string; credit?: string; pexelsUrl?: string } | null;
};

type RelatedArticle = {
  _id: string;
  title: string;
  slug: string;
  category: string;
  readTime?: string;
};

type PortableBlock = {
  _type: string;
  _key: string;
  style?: string;
  children?: Array<{ _type: string; text?: string; marks?: string[] }>;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[àâä]/g, "a")
    .replace(/[éèêë]/g, "e")
    .replace(/[îï]/g, "i")
    .replace(/[ôö]/g, "o")
    .replace(/[ùûü]/g, "u")
    .replace(/ç/g, "c")
    .replace(/ñ/g, "n")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getBlockText(block: PortableBlock): string {
  return block.children?.map((c) => c.text ?? "").join("") ?? "";
}

function extractHeadings(content: PortableBlock[]): TOCHeading[] {
  return content
    .filter((b) => b._type === "block" && (b.style === "h2" || b.style === "h3"))
    .map((b) => ({
      id: slugify(getBlockText(b)),
      text: getBlockText(b),
      level: (b.style === "h2" ? 2 : 3) as 2 | 3,
    }));
}

function extractFAQ(content: PortableBlock[]): FAQItem[] {
  const items: FAQItem[] = [];
  let inFAQ = false;
  let currentQ = "";
  let currentA = "";

  for (const block of content) {
    if (block._type !== "block") continue;
    const text = getBlockText(block);

    if (block.style === "h2") {
      if (inFAQ && currentQ) {
        items.push({ question: currentQ, answer: currentA.trim() });
        currentQ = "";
        currentA = "";
      }
      inFAQ = text.toLowerCase().includes("faq") || text.toLowerCase().includes("question");
      continue;
    }

    if (!inFAQ) continue;

    if (block.style === "h3") {
      if (currentQ) items.push({ question: currentQ, answer: currentA.trim() });
      currentQ = text;
      currentA = "";
    } else if (block.style === "normal") {
      currentA += (currentA ? " " : "") + text;
    }
  }

  if (currentQ) items.push({ question: currentQ, answer: currentA.trim() });
  return items;
}

/** Split content at each H2 to enable CTA injection between sections */
function splitBySections(content: PortableBlock[]): PortableBlock[][] {
  const sections: PortableBlock[][] = [];
  let current: PortableBlock[] = [];

  for (const block of content) {
    if (block.style === "h2" && current.length > 0) {
      sections.push(current);
      current = [block];
    } else {
      current.push(block);
    }
  }
  if (current.length > 0) sections.push(current);
  return sections;
}

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
  return {
    title: article.seoTitle ?? `${article.title} | Vanzon Explorer`,
    description: article.seoDescription ?? article.excerpt,
    openGraph: {
      title: article.title,
      description: article.seoDescription ?? article.excerpt,
      images: article.coverImage?.url ? [{ url: article.coverImage.url }] : [],
      type: "article",
      publishedTime: article.publishedAt,
      locale: "fr_FR",
    },
  };
}

// ── Portable Text components ────────────────────────────────────────────────────

function makePortableComponents(headingIds: Map<string, string>) {
  return {
    block: {
      h2: ({
        children,
        value,
      }: {
        children?: React.ReactNode;
        value?: PortableBlock;
      }) => {
        const text = value ? getBlockText(value) : "";
        const id = headingIds.get(text) ?? slugify(text);
        return (
          <h2
            id={id}
            className="text-2xl font-black text-slate-900 mt-14 mb-5 scroll-mt-24"
          >
            {children}
          </h2>
        );
      },
      h3: ({
        children,
        value,
      }: {
        children?: React.ReactNode;
        value?: PortableBlock;
      }) => {
        const text = value ? getBlockText(value) : "";
        const id = headingIds.get(text) ?? slugify(text);
        return (
          <h3
            id={id}
            className="text-xl font-bold text-slate-900 mt-10 mb-4 scroll-mt-24"
          >
            {children}
          </h3>
        );
      },
      blockquote: ({ children }: { children?: React.ReactNode }) => (
        <blockquote className="my-8 pl-6 border-l-4 border-[#4D5FEC] bg-blue-50/50 py-4 pr-4 rounded-r-xl italic text-slate-600 text-[17px] leading-relaxed">
          {children}
        </blockquote>
      ),
      normal: ({ children }: { children?: React.ReactNode }) => (
        <p className="text-[17px] text-slate-600 leading-[1.75] mb-6">{children}</p>
      ),
    },
    marks: {
      strong: ({ children }: { children?: React.ReactNode }) => (
        <strong className="font-bold text-slate-800">{children}</strong>
      ),
      em: ({ children }: { children?: React.ReactNode }) => (
        <em className="italic text-slate-700">{children}</em>
      ),
      link: ({
        children,
        value,
      }: {
        children?: React.ReactNode;
        value?: { href?: string; blank?: boolean };
      }) => (
        <a
          href={value?.href}
          target={value?.blank ? "_blank" : undefined}
          rel={value?.blank ? "noopener noreferrer" : undefined}
          className="text-[#4D5FEC] underline underline-offset-2 hover:text-[#3B4FD4] transition-colors"
        >
          {children}
        </a>
      ),
    },
  };
}

// ── CTA between sections ───────────────────────────────────────────────────────

const SECTION_CTAS = [
  {
    label: "Louer un van aménagé au Pays Basque",
    sub: "Disponible dès 65€/nuit — livraison possible",
    href: "/location",
    accent: "bg-[#4D5FEC] hover:bg-[#3B4FD4]",
    icon: "🚐",
  },
  {
    label: "Trouver votre van idéal",
    sub: "Achat & accompagnement personnalisé avec Jules",
    href: "/achat",
    accent: "bg-slate-900 hover:bg-slate-800",
    icon: "🔑",
  },
] as const;

function SectionCTA({ index }: { index: number }) {
  const cta = SECTION_CTAS[index % SECTION_CTAS.length];
  return (
    <div className="my-10 p-6 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-blue-50/30 flex flex-col sm:flex-row items-center gap-5">
      <span className="text-4xl flex-shrink-0">{cta.icon}</span>
      <div className="flex-1 text-center sm:text-left">
        <p className="font-bold text-slate-900 text-base">{cta.label}</p>
        <p className="text-sm text-slate-500 mt-0.5">{cta.sub}</p>
      </div>
      <Link
        href={cta.href}
        className={`btn-shine flex-shrink-0 inline-flex items-center justify-center gap-2 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm relative overflow-hidden ${cta.accent}`}
      >
        Découvrir →
      </Link>
    </div>
  );
}

// ── Category color map ─────────────────────────────────────────────────────────

const categoryColorMap: Record<string, string> = {
  "Road Trips": "bg-blue-50 text-blue-700 ring-1 ring-blue-200/60",
  "Aménagement Van": "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60",
  "Business Van": "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60",
  "Achat Van": "bg-violet-50 text-violet-700 ring-1 ring-violet-200/60",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ── "Coming soon" articles (from queue — static) ───────────────────────────────

const COMING_SOON = [
  { title: "Entretien van aménagé : le guide complet", slug: "entretien-van-amenage" },
  { title: "Douche et eau chaude dans un van", slug: "douche-eau-chaude-van" },
  { title: "Cuisine dans un van : équipements essentiels", slug: "cuisine-van-amenage" },
];

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function ArticleDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const [article, relatedArticles] = await Promise.all([
    sanityFetch<ArticleDoc>(getArticleBySlugQuery, { slug: params.slug }),
    sanityFetch<RelatedArticle[]>(getRelatedArticlesQuery, { slug: params.slug }),
  ]);

  if (!article) notFound();

  const content = article.content ?? [];
  const headings = extractHeadings(content);
  const faqItems = extractFAQ(content);
  const sections = splitBySections(content);

  // Map heading text → id for the portable text renderer
  const headingIds = new Map(headings.map((h) => [h.text, h.id]));
  const portableComponents = makePortableComponents(headingIds);

  return (
    <main className="min-h-screen bg-white">
      {/* JSON-LD: Article + BreadcrumbList + FAQPage */}
      <ArticleJsonLd article={article} faqItems={faqItems} />

      {/* ── Hero cover image ── */}
      {article.coverImage?.url && (
        <div className="relative w-full h-[55vh] min-h-[340px] max-h-[560px] bg-slate-100">
          <Image
            src={article.coverImage.url}
            alt={article.coverImage.alt ?? article.title}
            fill
            className="object-cover"
            unoptimized
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/20 to-transparent" />
          {article.coverImage.credit && (
            <p className="absolute bottom-3 right-4 text-white/40 text-xs">
              {article.coverImage.credit}
            </p>
          )}
        </div>
      )}

      {/* ── Two-column layout ── */}
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-12 lg:grid lg:grid-cols-[1fr_272px] lg:gap-16 lg:items-start">

        {/* ── Main content ── */}
        <article className="min-w-0">

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
          </div>

          {/* H1 */}
          <h1 className="text-3xl md:text-[2.35rem] font-black text-slate-900 leading-tight tracking-tight mb-6">
            {article.title}
          </h1>

          {/* PAS intro — Problème / Agitation / Solution */}
          <div className="relative pl-5 border-l-4 border-[#4D5FEC] bg-blue-50/40 py-5 pr-5 rounded-r-2xl mb-10">
            <p className="text-[17px] text-slate-700 leading-[1.75] font-[450]">
              {article.excerpt}
            </p>
          </div>

          {/* ── Article body with CTA injection ── */}
          {content.length > 0 ? (
            <div>
              {sections.map((section, i) => (
                <div key={i}>
                  {/* @ts-expect-error portabletext generic types */}
                  <PortableText value={section} components={portableComponents} />
                  {/* Inject CTA after every 2nd section, skip last 2 sections */}
                  {i % 2 === 1 && i < sections.length - 2 && (
                    <SectionCTA index={Math.floor(i / 2)} />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 italic">Contenu de l&apos;article à venir.</p>
          )}

          {/* ── Internal links panel ── */}
          <div className="mt-16 pt-12 border-t border-slate-100 grid sm:grid-cols-2 gap-8">

            {/* Related published articles */}
            {relatedArticles && relatedArticles.length > 0 && (
              <div>
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

            {/* Coming soon articles */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-4">
                Prochainement sur le blog
              </h2>
              <ul className="space-y-3">
                {COMING_SOON.map((a) => (
                  <li key={a.slug} className="flex items-start gap-3 text-sm text-slate-400">
                    <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-slate-200 flex-shrink-0" />
                    <span>
                      {a.title}{" "}
                      <span className="text-xs text-slate-300 font-medium">— bientôt</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ── Footer CTA ── */}
          <div className="mt-12 pt-10 border-t border-slate-100">
            <p className="text-sm font-semibold text-slate-500 mb-5">Envie d&apos;aller plus loin ?</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/location"
                className="btn-primary btn-shine inline-flex items-center justify-center gap-2 text-sm"
              >
                🚐 Louer un van au Pays Basque
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
