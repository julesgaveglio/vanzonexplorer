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
import ReadingProgressBar from "./_components/ReadingProgressBar";
import ArticleFAQ from "./_components/ArticleFAQ";
import ArticleCategorySync from "./_components/ArticleCategorySync";
import ShareButton from "./_components/ShareButton";
import RoadTripCTA from "@/components/ui/RoadTripCTA";

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

/** Retourne uniquement les blocs AVANT le premier H2 "faq"/"question".
 *  Évite le doublon FAQ dans le corps + le composant ArticleFAQ. */
function contentBeforeFAQ(content: PortableBlock[]): PortableBlock[] {
  const idx = content.findIndex(
    (b) =>
      b._type === "block" &&
      b.style === "h2" &&
      (getBlockText(b).toLowerCase().includes("faq") ||
        getBlockText(b).toLowerCase().includes("question"))
  );
  return idx === -1 ? content : content.slice(0, idx);
}

/** Retourne les blocs APRÈS la section FAQ (Conclusion typiquement). */
function contentAfterFAQ(content: PortableBlock[]): PortableBlock[] {
  const faqIdx = content.findIndex(
    (b) =>
      b._type === "block" &&
      b.style === "h2" &&
      (getBlockText(b).toLowerCase().includes("faq") ||
        getBlockText(b).toLowerCase().includes("question"))
  );
  if (faqIdx === -1) return [];
  for (let i = faqIdx + 1; i < content.length; i++) {
    if (content[i]._type === "block" && content[i].style === "h2") {
      return content.slice(i);
    }
  }
  return [];
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

// ── Inline markdown parser (fallback for raw link/bold/italic syntax) ───────────

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const regex = /\*\*([^*\n]+?)\*\*|\*([^*\n]+?)\*|\[([^\]]+)\]\(([^)]+)\)/g;
  const result: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push(text.slice(lastIndex, match.index));
    }
    if (match[1] !== undefined) {
      result.push(<strong key={match.index} className="font-bold text-slate-800">{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      result.push(<em key={match.index} className="italic text-slate-700">{match[2]}</em>);
    } else if (match[3] !== undefined && match[4] !== undefined) {
      const href = match[4];
      const isExternal = href.startsWith("http");
      result.push(
        <a
          key={match.index}
          href={href}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="text-[#4D5FEC] underline underline-offset-2 hover:text-[#3B4FD4] transition-colors"
        >
          {match[3]}
        </a>
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) result.push(text.slice(lastIndex));
  return result.length > 0 ? result : [text];
}

// ── Table markdown renderer ────────────────────────────────────────────────────

function ArticleTable({ rows }: { rows: string[] }) {
  const parseRow = (row: string) =>
    row.split("|").map((c) => c.trim()).filter((c) => c !== "");

  // Filter out separator rows (| :--- | --- | :---: |)
  const dataRows = rows.filter((r) => !/^\|[\s:|-]+\|$/.test(r.replace(/\s/g, "")));
  if (dataRows.length === 0) return null;

  const headerCells = parseRow(dataRows[0]);
  const bodyRows = dataRows.slice(1).map(parseRow);

  return (
    <div className="overflow-x-auto my-8 rounded-2xl border border-slate-200">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {headerCells.map((cell, i) => (
              <th key={i} className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {bodyRows.map((row, ri) => (
            <tr key={ri} className="hover:bg-slate-50/60 transition-colors">
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-3 text-slate-600 align-top">
                  {renderInlineMarkdown(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Pre-process: group consecutive table rows into virtual table blocks ─────────

type VirtualBlock =
  | PortableBlock
  | { _type: "table"; _key: string; rows: string[] };

function groupTableBlocks(blocks: PortableBlock[]): VirtualBlock[] {
  const result: VirtualBlock[] = [];
  let tableRows: string[] = [];

  const flushTable = () => {
    if (tableRows.length > 0) {
      result.push({
        _type: "table" as const,
        _key: Math.random().toString(36).slice(2),
        rows: [...tableRows],
      });
      tableRows = [];
    }
  };

  for (const block of blocks) {
    const text = getBlockText(block);
    const isTableRow = block._type === "block" && block.style === "normal" && text.trimStart().startsWith("|");
    if (isTableRow) {
      tableRows.push(text);
    } else {
      flushTable();
      result.push(block);
    }
  }
  flushTable();
  return result;
}

// ── Portable Text components ────────────────────────────────────────────────────

function makePortableComponents(headingIds: Map<string, string>) {
  return {
    types: {
      image: ({
        value,
      }: {
        value?: {
          alt?: string;
          asset?: { url?: string; metadata?: { dimensions?: { width?: number; height?: number } } };
        };
      }) => {
        const src = value?.asset?.url;
        if (!src) return null;
        const dims = value?.asset?.metadata?.dimensions;
        const aspectClass = dims && dims.width && dims.height
          ? dims.width / dims.height > 1.5 ? "aspect-[16/9]" : "aspect-[4/3]"
          : "aspect-[16/9]";
        return (
          <figure className="my-10 not-prose">
            <div className={`relative w-full ${aspectClass} rounded-2xl overflow-hidden bg-slate-100`}>
              <Image
                src={src}
                alt={value?.alt ?? "Illustration de l'article"}
                fill
                sizes="(max-width: 768px) 100vw, 65vw"
                className="object-cover"
                loading="lazy"
              />
            </div>
            {value?.alt && (
              <figcaption className="text-center text-xs text-slate-400 mt-2.5 italic">
                {value.alt}
              </figcaption>
            )}
          </figure>
        );
      },
    },
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
        <blockquote className="my-8 pl-5 border-l-4 border-[#4D5FEC] bg-blue-50/50 py-4 pr-5 rounded-r-xl italic text-slate-600 text-[17px] leading-relaxed">
          {children}
        </blockquote>
      ),
      normal: ({ children, value }: { children?: React.ReactNode; value?: PortableBlock }) => {
        const text = value ? getBlockText(value) : "";
        const isWarning = text.startsWith("⚠️") || text.startsWith("🚫");
        const isTip = text.startsWith("💡") || text.startsWith("✅");
        const isInfo = text.startsWith("ℹ️") || text.startsWith("📋");

        if (isWarning) {
          return (
            <div className="my-6 flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-[15px] text-amber-800 leading-relaxed">
              <span className="flex-shrink-0 text-lg">⚠️</span>
              <p>{text.replace(/^⚠️\s*|^🚫\s*/, "")}</p>
            </div>
          );
        }
        if (isTip) {
          return (
            <div className="my-6 flex gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-[15px] text-emerald-800 leading-relaxed">
              <span className="flex-shrink-0 text-lg">{text.startsWith("💡") ? "💡" : "✅"}</span>
              <p>{text.replace(/^💡\s*|^✅\s*/, "")}</p>
            </div>
          );
        }
        if (isInfo) {
          return (
            <div className="my-6 flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-[15px] text-blue-800 leading-relaxed">
              <span className="flex-shrink-0 text-lg">{text.startsWith("ℹ️") ? "ℹ️" : "📋"}</span>
              <p>{text.replace(/^ℹ️\s*|^📋\s*/, "")}</p>
            </div>
          );
        }

        // Fallback: if block text contains raw markdown link syntax, render it
        const hasRawMarkdown = text.includes("[") && text.includes("](");
        if (hasRawMarkdown) {
          return <p className="text-[18px] text-slate-600 leading-[1.75] mb-6">{renderInlineMarkdown(text)}</p>;
        }

        return <p className="text-[18px] text-slate-600 leading-[1.75] mb-6">{children}</p>;
      },
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

// ── Render helper: handles virtual table blocks + PortableText ─────────────────

function renderBlocks(
  blocks: PortableBlock[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  components: any
): React.ReactNode {
  const virtualBlocks = groupTableBlocks(blocks);
  return virtualBlocks.map((block, i) => {
    if (block._type === "table") {
      const tb = block as { _type: "table"; _key: string; rows: string[] };
      return <ArticleTable key={tb._key || i} rows={tb.rows} />;
    }
    const pb = block as PortableBlock;
    return (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      <PortableText key={pb._key || i} value={[pb] as any} components={components} />
    );
  });
}

// ── CTA between sections ───────────────────────────────────────────────────────

const SECTION_CTAS = [
  {
    label: "Louer un van pour ce road trip",
    sub: "Disponible dès 65€/nuit — livraison Pays Basque possible",
    href: "/location",
    cta: "Voir les vans disponibles →",
    accent: "bg-[#4D5FEC] hover:bg-[#3B4FD4]",
    icon: "🚐",
  },
  {
    label: "Votre propre van aménagé",
    sub: "Accompagnement personnalisé pour trouver et aménager votre van",
    href: "/achat",
    cta: "Parler à Jules →",
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
        {cta.cta}
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

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function ArticleDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  // Sequential: relatedArticles depends on article.category for same-category sorting
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

  // Map heading text → id for the portable text renderer
  const headingIds = new Map(headings.map((h) => [h.text, h.id]));
  const portableComponents = makePortableComponents(headingIds);

  return (
    <main className="min-h-screen bg-white">
      <ReadingProgressBar />
      <ArticleCategorySync category={article.category} />
      {/* JSON-LD: Article + BreadcrumbList + FAQPage */}
      <ArticleJsonLd article={{ ...article, updatedAt: article.updatedAt }} faqItems={faqItems} />

      {/* ── Hero cover image ── */}
      {article.coverImage?.url && (
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
      )}

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

          {/* PAS intro — Problème / Agitation / Solution */}
          <div className="relative pl-5 border-l-4 border-[#4D5FEC] bg-blue-50/40 py-5 pr-5 rounded-r-2xl mb-10">
            <p className="text-[17px] text-slate-700 leading-[1.75] font-[450]">
              {article.excerpt}
            </p>
          </div>

          {/* Inline TOC — visible after intro on all screens */}
          {headings.filter(h => h.level === 2).length > 1 && (
            <nav aria-label="Sommaire" className="my-8 p-5 rounded-2xl border border-slate-100 bg-slate-50/60">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">📋 Dans cet article</p>
              <ol className="space-y-2">
                {headings.filter(h => h.level === 2).map((h, i) => (
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

          {/* ── FAQ accordion — ancre pour TOC ── */}
          {faqHeading && (
            <div id={faqHeading.id} className="scroll-mt-24" />
          )}
          <ArticleFAQ faqItems={faqItems} />

          {/* ── Conclusion (contenu après FAQ) ── */}
          {conclusionContent.length > 0 && (
            <div>
              {renderBlocks(conclusionContent, portableComponents)}
            </div>
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
                  <span>🚐 Louer un van pour ce road trip</span>
                  <span className="text-[11px] font-normal opacity-80">Disponible dès 65€/nuit — livraison Pays Basque possible</span>
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
