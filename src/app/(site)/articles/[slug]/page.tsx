import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { PortableText } from "@portabletext/react";
import { sanityFetch } from "@/lib/sanity/client";
import { getArticleBySlugQuery, getAllArticleSlugsQuery } from "@/lib/sanity/queries";
import { ArticleJsonLd } from "@/components/seo/JsonLd";

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
  content?: unknown[];
  seoTitle?: string;
  seoDescription?: string;
  coverImage?: { url: string; alt?: string; credit?: string; pexelsUrl?: string } | null;
};

export async function generateStaticParams() {
  const slugs = await sanityFetch<{ slug: string }[]>(getAllArticleSlugsQuery);
  return (slugs ?? []).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = await sanityFetch<ArticleDoc>(getArticleBySlugQuery, { slug: params.slug });
  if (!article) return {};
  return {
    title: article.seoTitle ?? `${article.title} | Vanzon Explorer`,
    description: article.seoDescription ?? article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: article.coverImage?.url ? [{ url: article.coverImage.url }] : [],
    },
  };
}

const portableComponents = {
  block: {
    h2: ({ children }: { children?: React.ReactNode }) => (
      <h2 className="text-2xl font-black text-slate-900 mt-12 mb-4">{children}</h2>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
      <h3 className="text-xl font-bold text-slate-900 mt-8 mb-3">{children}</h3>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
      <blockquote className="border-l-4 border-[#4D5FEC] pl-5 my-6 italic text-slate-600">{children}</blockquote>
    ),
    normal: ({ children }: { children?: React.ReactNode }) => (
      <p className="text-slate-600 leading-relaxed mb-5">{children}</p>
    ),
  },
};

const categoryColorMap: Record<string, string> = {
  "Road Trips": "bg-blue-50 text-blue-700",
  "Aménagement Van": "bg-emerald-50 text-emerald-700",
  "Business Van": "bg-amber-50 text-amber-700",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default async function ArticleDetailPage({ params }: { params: { slug: string } }) {
  const article = await sanityFetch<ArticleDoc>(getArticleBySlugQuery, { slug: params.slug });

  if (!article) notFound();

  return (
    <main className="min-h-screen bg-white">
      <ArticleJsonLd article={article} />
      {/* Cover */}
      {article.coverImage?.url && (
        <div className="relative w-full h-[50vh] min-h-[320px] max-h-[520px] bg-slate-100">
          <Image
            src={article.coverImage.url}
            alt={article.coverImage.alt ?? article.title}
            fill
            className="object-cover"
            unoptimized
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/20 to-transparent" />
          {article.coverImage.credit && (
            <p className="absolute bottom-3 right-4 text-white/50 text-xs">{article.coverImage.credit}</p>
          )}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8">
          <Link href="/articles" className="hover:text-[#4D5FEC] transition-colors">Articles</Link>
          <span>/</span>
          <span className="text-slate-600 truncate">{article.title}</span>
        </nav>

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${categoryColorMap[article.category] ?? "bg-slate-100 text-slate-600"}`}>
            {article.category}
          </span>
          {article.tag && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700">
              {article.tag}
            </span>
          )}
          {article.readTime && (
            <span className="text-xs text-slate-400">{article.readTime} de lecture</span>
          )}
          <span className="text-xs text-slate-400">{formatDate(article.publishedAt)}</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-5">{article.title}</h1>
        <p className="text-lg text-slate-500 leading-relaxed mb-10 border-b border-slate-100 pb-10">{article.excerpt}</p>

        {/* Content */}
        {article.content && article.content.length > 0 ? (
          <div className="prose-custom">
            {/* @ts-expect-error portabletext types */}
            <PortableText value={article.content} components={portableComponents} />
          </div>
        ) : (
          <p className="text-slate-400 italic">Contenu de l&apos;article à venir.</p>
        )}

        {/* Footer CTA */}
        <div className="mt-16 pt-10 border-t border-slate-100 flex flex-col sm:flex-row gap-4">
          <Link href="/location" className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white font-bold px-7 py-3.5 rounded-xl hover:bg-slate-800 transition-colors text-sm">
            Louer un van au Pays Basque
          </Link>
          <Link href="/articles" className="inline-flex items-center justify-center gap-2 border border-slate-200 text-slate-600 font-semibold px-7 py-3.5 rounded-xl hover:border-[#4D5FEC]/40 hover:text-[#4D5FEC] transition-colors text-sm">
            ← Tous les articles
          </Link>
        </div>
      </div>
    </main>
  );
}
