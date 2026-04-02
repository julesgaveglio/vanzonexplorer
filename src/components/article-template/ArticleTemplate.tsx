"use client";

/**
 * ArticleTemplate — Template blog Vanzon Explorer
 *
 * Composant centralisé qui reproduit exactement le rendu des articles publiés
 * sur vanzonexplorer.com/articles/[slug]. Modifier ce fichier met à jour
 * toutes les pages de preview de l'éditeur admin.
 *
 * Accent color officielle : #4D5FEC
 * Typo corps : Georgia/serif 18px, line-height 1.75
 * Typo titres : Inter/sans-serif, font-black
 */

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface TOCItem {
  id: string;
  text: string;
  level: 2 | 3;
}

interface ArticleTemplateProps {
  title: string;
  excerpt?: string;
  html_content: string;
  target_url?: string;
  category?: string;
  /** ISO date string */
  publishedAt?: string;
  /** Afficher la barre admin (bouton publier, retour) */
  adminBar?: React.ReactNode;
}

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

/** Extrait les titres h2/h3 depuis le HTML brut */
function extractTOC(html: string): TOCItem[] {
  const items: TOCItem[] = [];
  const regex = /<h([23])[^>]*>([\s\S]*?)<\/h[23]>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const level = parseInt(match[1]) as 2 | 3;
    const raw = match[2].replace(/<[^>]+>/g, "").trim();
    if (raw) items.push({ id: slugify(raw), text: raw, level });
  }
  return items;
}

/** Injecte des id sur les balises h2/h3 pour les ancres TOC */
function injectHeadingIds(html: string): string {
  return html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h[23]>/gi, (_, level, attrs, inner) => {
    const raw = inner.replace(/<[^>]+>/g, "").trim();
    const id = slugify(raw);
    return `<h${level} id="${id}"${attrs}>${inner}</h${level}>`;
  });
}

/** Calcule le temps de lecture (200 mots/min) */
function readingTime(html: string): number {
  const words = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

const categoryColorMap: Record<string, string> = {
  "Road Trips": "bg-blue-50 text-blue-700 ring-1 ring-blue-200/60",
  "Aménagement Van": "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60",
  "Business Van": "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60",
  "Achat Van": "bg-violet-50 text-violet-700 ring-1 ring-violet-200/60",
};

function formatDate(iso?: string): string {
  if (!iso) return new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

// ── Composant principal ────────────────────────────────────────────────────────

export default function ArticleTemplate({
  title,
  excerpt,
  html_content,
  target_url,
  category,
  publishedAt,
  adminBar,
}: ArticleTemplateProps) {
  const toc = useMemo(() => extractTOC(html_content), [html_content]);
  const enrichedHtml = useMemo(() => injectHeadingIds(html_content), [html_content]);
  const readMin = useMemo(() => readingTime(html_content), [html_content]);
  const h2Items = toc.filter((h) => h.level === 2);

  return (
    <div className="min-h-screen bg-white">

      {/* Barre admin optionnelle */}
      {adminBar}

      {/* ── Hero titre ── */}
      <div className="max-w-[1120px] mx-auto px-4 sm:px-6 pt-10 pb-0 lg:grid lg:grid-cols-[1fr_272px] lg:gap-16 lg:items-start">

        {/* ── Colonne principale ── */}
        <article className="min-w-0 max-w-[750px]">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8">
            <Link href="/" className="hover:text-[#4D5FEC] transition-colors">Accueil</Link>
            <span>/</span>
            <Link href="/articles" className="hover:text-[#4D5FEC] transition-colors">Articles</Link>
            <span>/</span>
            <span className="text-slate-600 truncate max-w-[220px]">{title}</span>
          </nav>

          {/* Meta badges */}
          <div className="flex flex-wrap items-center gap-2.5 mb-6">
            {category && (
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${categoryColorMap[category] ?? "bg-slate-100 text-slate-600"}`}>
                {category}
              </span>
            )}
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
              </svg>
              {readMin} min de lecture
            </span>
            <span className="text-xs text-slate-400">{formatDate(publishedAt)}</span>
            {target_url && (
              <a
                href={target_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#4D5FEC] hover:underline ml-auto"
              >
                {target_url.replace("https://", "")}
              </a>
            )}
          </div>

          {/* H1 */}
          <h1 className="text-3xl md:text-[2.35rem] font-black text-slate-900 leading-tight tracking-tight mb-6">
            {title}
          </h1>

          {/* Excerpt — encadré bleu */}
          {excerpt && (
            <div className="relative pl-5 border-l-4 border-[#4D5FEC] bg-blue-50/40 py-5 pr-5 rounded-r-2xl mb-10">
              <p className="text-[17px] text-slate-700 leading-[1.75] font-[450]">
                {excerpt}
              </p>
            </div>
          )}

          {/* Inline TOC */}
          {h2Items.length > 1 && (
            <nav aria-label="Sommaire" className="my-8 p-5 rounded-2xl border border-slate-100 bg-slate-50/60">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">📋 Dans cet article</p>
              <ol className="space-y-2">
                {h2Items.map((h, i) => (
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

          {/* Corps de l'article */}
          <div
            className="vanzon-article-body"
            dangerouslySetInnerHTML={{ __html: enrichedHtml }}
          />

          {/* ── Auteurs ── */}
          <div className="mt-14 pt-10 border-t border-slate-100">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">À propos des auteurs</p>
            <div className="p-5 rounded-2xl border border-slate-100 bg-white shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex -space-x-3 flex-shrink-0">
                  <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-white shadow-sm">
                    <Image
                      src="https://cdn.sanity.io/images/lewexa74/production/16f9120e659bdd4bba47e663e9df9a1a9293fe3f-1170x2080.jpg?auto=format&q=82"
                      alt="Jules Gaveglio"
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  </div>
                  <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-white shadow-sm">
                    <Image
                      src="https://cdn.sanity.io/images/lewexa74/production/325f3ebf1d68fd890487229864c73cc65bef20d3-1186x1654.png?auto=format&q=82"
                      alt="Elio"
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm leading-none mb-1">Jules &amp; Elio</p>
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

          {/* ── Footer CTAs ── */}
          <div className="mt-12 pt-10 border-t border-slate-100">
            <p className="text-sm font-semibold text-slate-500 mb-5">Envie d&apos;aller plus loin ?</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/location"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#4D5FEC] hover:bg-[#3B4FD4] text-white font-bold rounded-xl transition-colors text-sm"
              >
                🚐 Louer un van au Pays Basque
              </Link>
              <Link
                href="/articles"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 font-semibold rounded-xl transition-colors text-sm"
              >
                ← Tous les articles
              </Link>
            </div>
          </div>
        </article>

        {/* ── Sidebar TOC sticky ── */}
        {toc.length > 2 && (
          <aside className="hidden lg:block sticky top-24 self-start">
            <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/60">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Sommaire</p>
              <nav className="space-y-1.5">
                {toc.map((h) => (
                  <a
                    key={h.id}
                    href={`#${h.id}`}
                    className={`block text-sm transition-colors hover:text-[#4D5FEC] leading-snug ${
                      h.level === 2 ? "text-slate-600 font-medium" : "text-slate-400 pl-3 text-xs"
                    }`}
                  >
                    {h.text}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        )}
      </div>

      {/* Styles article — identiques au rendu Sanity réel */}
      <style>{`
        .vanzon-article-body {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 18px;
          line-height: 1.75;
          color: #475569;
        }
        /* Supprimer le h1 du HTML (déjà affiché par le template) */
        .vanzon-article-body > h1:first-child {
          display: none;
        }
        .vanzon-article-body h1 {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 2.35rem;
          font-weight: 900;
          color: #0f172a;
          margin: 3.5rem 0 1.25rem;
          line-height: 1.15;
          letter-spacing: -0.015em;
        }
        .vanzon-article-body h2 {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 1.5rem;
          font-weight: 900;
          color: #0f172a;
          margin: 3.5rem 0 1.25rem;
          scroll-margin-top: 6rem;
          line-height: 1.2;
        }
        .vanzon-article-body h3 {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: #0f172a;
          margin: 2.5rem 0 1rem;
          scroll-margin-top: 6rem;
          line-height: 1.3;
        }
        .vanzon-article-body p {
          margin: 0 0 1.5rem;
          color: #475569;
        }
        .vanzon-article-body ul,
        .vanzon-article-body ol {
          margin: 0 0 1.5rem;
          padding-left: 1.5rem;
        }
        .vanzon-article-body li {
          margin-bottom: 0.5rem;
          color: #475569;
        }
        .vanzon-article-body strong {
          font-weight: 700;
          color: #1e293b;
        }
        .vanzon-article-body em {
          font-style: italic;
          color: #64748b;
        }
        .vanzon-article-body a {
          color: #4D5FEC;
          text-decoration: underline;
          text-underline-offset: 2px;
          transition: color 0.15s;
        }
        .vanzon-article-body a:hover {
          color: #3B4FD4;
        }
        .vanzon-article-body blockquote {
          margin: 2rem 0;
          padding: 1rem 1.25rem;
          border-left: 4px solid #4D5FEC;
          background: rgba(239, 246, 255, 0.5);
          border-radius: 0 0.75rem 0.75rem 0;
          font-style: italic;
          color: #475569;
          font-size: 1.0625rem;
          line-height: 1.6;
        }
        .vanzon-article-body blockquote strong {
          color: #1e293b;
          font-style: normal;
        }
        .vanzon-article-body table {
          width: 100%;
          border-collapse: collapse;
          margin: 2rem 0;
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 0.875rem;
          border-radius: 0.75rem;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        .vanzon-article-body th {
          background: #f8fafc;
          padding: 0.75rem 1rem;
          text-align: left;
          font-weight: 600;
          color: #475569;
          border-bottom: 1px solid #e2e8f0;
        }
        .vanzon-article-body td {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid #f1f5f9;
          color: #64748b;
          vertical-align: top;
        }
        .vanzon-article-body tr:last-child td {
          border-bottom: none;
        }
        .vanzon-article-body tr:hover td {
          background: #f8fafc;
        }
        .vanzon-article-body hr {
          margin: 3rem 0;
          border: none;
          border-top: 1px solid #e2e8f0;
        }
      `}</style>
    </div>
  );
}
