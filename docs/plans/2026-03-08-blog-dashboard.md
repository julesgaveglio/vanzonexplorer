# Blog Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Créer `/admin/blog` — tableau de bord complet pour piloter les articles de blog publiés et la file d'attente, avec slots métriques prêts pour Google Search Console + GA4.

**Architecture:** Page Next.js 14 Server Component qui lit `scripts/data/article-queue.json` via une API route protégée par Clerk. Composants Client séparés pour l'interactivité (filtres, onglets). Aucune base de données supplémentaire.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Clerk (auth), `fs/promises` pour lire le JSON.

---

## Fichiers critiques de référence

| Fichier | Rôle |
|---------|------|
| `src/app/admin/layout.tsx` | Layout admin (Clerk auth, sidebar) |
| `src/app/admin/_components/AdminSidebar.tsx` | Sidebar à modifier |
| `src/app/admin/vans/page.tsx` | Pattern Server Component admin |
| `scripts/data/article-queue.json` | Source de données articles |

## Types partagés

```typescript
// Article statuses
type ArticleStatus = "pending" | "writing" | "published" | "needs-improvement";

interface ArticleQueueItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: "Road Trips" | "Aménagement Van" | "Business Van" | "Achat Van";
  tag: string | null;
  readTime: string;
  targetKeyword: string;
  secondaryKeywords: string[];
  status: ArticleStatus;
  priority: number;
  sanityId: string | null;
  publishedAt: string | null;
  lastSeoCheck: string | null;
  seoPosition: number | null;
}
```

---

## Task 1 : API Route — Lire la queue

**Fichiers :**
- Créer : `src/app/api/admin/article-queue/route.ts`

**Step 1 : Créer le fichier**

```typescript
// src/app/api/admin/article-queue/route.ts
import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { readFile } from "fs/promises";
import path from "path";

const ALLOWED_EMAIL = "gavegliojules@gmail.com";

export async function GET() {
  // Auth check
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (email !== ALLOWED_EMAIL) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const queuePath = path.resolve(process.cwd(), "scripts/data/article-queue.json");
    const raw = await readFile(queuePath, "utf-8");
    const queue = JSON.parse(raw);
    return NextResponse.json(queue);
  } catch {
    return NextResponse.json({ error: "Queue file not found" }, { status: 404 });
  }
}
```

**Step 2 : Tester manuellement**

Avec le dev server lancé (`npm run dev`) :
```
curl http://localhost:3000/api/admin/article-queue
```
Attendu : tableau JSON des 22 articles.

**Step 3 : Commit**

```bash
git add src/app/api/admin/article-queue/route.ts
git commit -m "feat: API route GET /api/admin/article-queue"
```

---

## Task 2 : Types partagés

**Fichiers :**
- Créer : `src/app/admin/blog/types.ts`

**Step 1 : Créer le fichier**

```typescript
// src/app/admin/blog/types.ts
export type ArticleStatus = "pending" | "writing" | "published" | "needs-improvement";

export interface ArticleQueueItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: "Road Trips" | "Aménagement Van" | "Business Van" | "Achat Van";
  tag: string | null;
  readTime: string;
  targetKeyword: string;
  secondaryKeywords: string[];
  status: ArticleStatus;
  priority: number;
  sanityId: string | null;
  publishedAt: string | null;
  lastSeoCheck: string | null;
  seoPosition: number | null;
}

// Future GSC/GA4 integration slot
export interface GscMetrics {
  position?: number;
  clicks?: number;
  impressions?: number;
  ctr?: number;
  sessions?: number;
}

export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  "Road Trips": { bg: "bg-blue-50", text: "text-blue-700" },
  "Aménagement Van": { bg: "bg-emerald-50", text: "text-emerald-700" },
  "Business Van": { bg: "bg-amber-50", text: "text-amber-700" },
  "Achat Van": { bg: "bg-violet-50", text: "text-violet-700" },
};

export const STATUS_CONFIG: Record<ArticleStatus, { label: string; bg: string; text: string; dot: string }> = {
  pending: { label: "En attente", bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
  writing: { label: "En rédaction", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  published: { label: "Publié", bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  "needs-improvement": { label: "À améliorer", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
};
```

**Step 2 : Commit**

```bash
git add src/app/admin/blog/types.ts
git commit -m "feat: shared types for blog dashboard"
```

---

## Task 3 : Composant KpiBar

**Fichiers :**
- Créer : `src/app/admin/blog/_components/KpiBar.tsx`

**Step 1 : Créer le composant**

```tsx
// src/app/admin/blog/_components/KpiBar.tsx
import type { ArticleQueueItem } from "../types";

interface KpiBarProps {
  articles: ArticleQueueItem[];
}

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
  placeholder?: boolean;
  icon: React.ReactNode;
}

function KpiCard({ label, value, sub, accent, placeholder, icon }: KpiCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${accent}15` }}>
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className={`text-2xl font-black ${placeholder ? "text-slate-300" : "text-slate-900"}`}>{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        {placeholder && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full mt-1 border border-slate-100">
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Non connecté
          </span>
        )}
      </div>
    </div>
  );
}

export default function KpiBar({ articles }: KpiBarProps) {
  const published = articles.filter((a) => a.status === "published").length;
  const pending = articles.filter((a) => a.status === "pending").length;
  const writing = articles.filter((a) => a.status === "writing").length;
  const needsWork = articles.filter((a) => a.status === "needs-improvement").length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      <KpiCard
        label="Publiés"
        value={published}
        sub={`sur ${articles.length} total`}
        accent="#22C55E"
        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
      />
      <KpiCard
        label="En attente"
        value={pending}
        sub={writing > 0 ? `+ ${writing} en rédaction` : "dans la queue"}
        accent="#6366F1"
        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
      />
      <KpiCard
        label="À améliorer"
        value={needsWork || "—"}
        sub="position > 15"
        accent="#F59E0B"
        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
      />
      <KpiCard
        label="Position SEO moy."
        value="--"
        placeholder
        accent="#3B82F6"
        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
      />
      <KpiCard
        label="Visiteurs / mois"
        value="--"
        placeholder
        accent="#EC4899"
        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
      />
    </div>
  );
}
```

**Step 2 : Commit**

```bash
git add src/app/admin/blog/_components/KpiBar.tsx
git commit -m "feat: KpiBar component for blog dashboard"
```

---

## Task 4 : Composant PublishedArticlesTable

**Fichiers :**
- Créer : `src/app/admin/blog/_components/PublishedArticlesTable.tsx`

**Step 1 : Créer le composant**

```tsx
// src/app/admin/blog/_components/PublishedArticlesTable.tsx
import type { ArticleQueueItem, GscMetrics } from "../types";
import { CATEGORY_COLORS, STATUS_CONFIG } from "../types";

interface PublishedArticlesTableProps {
  articles: ArticleQueueItem[];
  gscMetrics?: Record<string, GscMetrics>; // slug → metrics, future GSC hook
}

export default function PublishedArticlesTable({ articles, gscMetrics = {} }: PublishedArticlesTableProps) {
  const published = articles.filter((a) => a.status === "published" || a.status === "needs-improvement");

  if (published.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
        <p className="text-slate-400 text-sm">Aucun article publié pour l&apos;instant.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <h2 className="font-bold text-slate-900">Articles publiés</h2>
          <span className="text-xs text-slate-400 font-medium">{published.length} article{published.length > 1 ? "s" : ""}</span>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          Google Search Console non connecté
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-50">
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3">Article</th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Catégorie</th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Keyword cible</th>
              <th className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Position</th>
              <th className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Clics</th>
              <th className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Impressions</th>
              <th className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">CTR</th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Statut</th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {published.map((article) => {
              const metrics = gscMetrics[article.slug];
              const catColor = CATEGORY_COLORS[article.category];
              const statusCfg = STATUS_CONFIG[article.status];

              return (
                <tr key={article.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* Titre */}
                  <td className="px-6 py-4 max-w-[280px]">
                    <a
                      href={`/articles/${article.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-slate-800 hover:text-blue-600 transition-colors line-clamp-2"
                    >
                      {article.title}
                    </a>
                    {article.publishedAt && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(article.publishedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    )}
                  </td>

                  {/* Catégorie */}
                  <td className="px-4 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${catColor.bg} ${catColor.text}`}>
                      {article.category}
                    </span>
                  </td>

                  {/* Keyword */}
                  <td className="px-4 py-4 max-w-[160px]">
                    <span className="text-xs text-slate-600 font-mono bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 line-clamp-1">
                      {article.targetKeyword}
                    </span>
                  </td>

                  {/* Position */}
                  <td className="px-4 py-4 text-center">
                    {metrics?.position ? (
                      <span className={`text-sm font-bold ${metrics.position <= 10 ? "text-green-600" : metrics.position <= 20 ? "text-amber-600" : "text-red-500"}`}>
                        #{metrics.position}
                      </span>
                    ) : article.seoPosition ? (
                      <span className={`text-sm font-bold ${article.seoPosition <= 10 ? "text-green-600" : article.seoPosition <= 20 ? "text-amber-600" : "text-red-500"}`}>
                        #{article.seoPosition}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-sm font-medium">--</span>
                    )}
                  </td>

                  {/* Clics */}
                  <td className="px-4 py-4 text-center">
                    <span className="text-slate-300 text-sm font-medium">{metrics?.clicks ?? "--"}</span>
                  </td>

                  {/* Impressions */}
                  <td className="px-4 py-4 text-center">
                    <span className="text-slate-300 text-sm font-medium">{metrics?.impressions ?? "--"}</span>
                  </td>

                  {/* CTR */}
                  <td className="px-4 py-4 text-center">
                    <span className="text-slate-300 text-sm font-medium">
                      {metrics?.ctr ? `${(metrics.ctr * 100).toFixed(1)}%` : "--"}
                    </span>
                  </td>

                  {/* Statut */}
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${statusCfg.bg} ${statusCfg.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                      {statusCfg.label}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <a
                        href={`/articles/${article.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors bg-slate-50 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Voir
                      </a>
                      {article.sanityId && (
                        <a
                          href={`/studio/structure/article;${article.sanityId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-purple-600 transition-colors bg-slate-50 hover:bg-purple-50 px-2.5 py-1.5 rounded-lg"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Sanity
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**Step 2 : Commit**

```bash
git add src/app/admin/blog/_components/PublishedArticlesTable.tsx
git commit -m "feat: PublishedArticlesTable with GSC metric slots"
```

---

## Task 5 : Composant ArticleQueueList

**Fichiers :**
- Créer : `src/app/admin/blog/_components/ArticleQueueList.tsx`

**Step 1 : Créer le composant**

```tsx
// src/app/admin/blog/_components/ArticleQueueList.tsx
import type { ArticleQueueItem } from "../types";
import { CATEGORY_COLORS, STATUS_CONFIG } from "../types";

interface ArticleQueueListProps {
  articles: ArticleQueueItem[];
}

function estimatedPublishDate(priority: number): string {
  const date = new Date();
  date.setDate(date.getDate() + priority);
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function ArticleQueueList({ articles }: ArticleQueueListProps) {
  const queued = articles
    .filter((a) => a.status === "pending" || a.status === "writing" || a.status === "needs-improvement")
    .sort((a, b) => a.priority - b.priority);

  if (queued.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
        <p className="text-slate-400 text-sm">La file d&apos;attente est vide.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
        <h2 className="font-bold text-slate-900">File d&apos;attente</h2>
        <span className="text-xs text-slate-400 font-medium">{queued.length} articles</span>
        <span className="ml-auto text-xs text-slate-400">~1 article / jour via GitHub Actions</span>
      </div>

      {/* Liste */}
      <div className="divide-y divide-slate-50">
        {queued.map((article, index) => {
          const catColor = CATEGORY_COLORS[article.category];
          const statusCfg = STATUS_CONFIG[article.status];
          const isWriting = article.status === "writing";

          return (
            <div key={article.id} className={`flex items-center gap-4 px-6 py-4 transition-colors ${isWriting ? "bg-blue-50/40" : "hover:bg-slate-50/40"}`}>
              {/* Numéro de priorité */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2"
                style={{ borderColor: isWriting ? "#3B82F6" : "#E2E8F0", color: isWriting ? "#3B82F6" : "#94A3B8" }}>
                {index + 1}
              </div>

              {/* Contenu principal */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${catColor.bg} ${catColor.text}`}>
                    {article.category}
                  </span>
                  {article.tag && (
                    <span className="text-xs text-slate-400 font-medium">· {article.tag}</span>
                  )}
                </div>
                <p className="text-sm font-semibold text-slate-800 truncate">{article.title}</p>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">{article.targetKeyword}</p>
              </div>

              {/* Statut */}
              <div className="flex-shrink-0 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${statusCfg.bg} ${statusCfg.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} ${isWriting ? "animate-pulse" : ""}`} />
                  {statusCfg.label}
                </span>
              </div>

              {/* Date estimée */}
              <div className="flex-shrink-0 text-right hidden md:block">
                {article.status === "pending" ? (
                  <>
                    <p className="text-xs text-slate-400">Prévu</p>
                    <p className="text-xs font-semibold text-slate-600">{estimatedPublishDate(index + 1)}</p>
                  </>
                ) : article.status === "writing" ? (
                  <p className="text-xs font-semibold text-blue-600">Aujourd&apos;hui</p>
                ) : (
                  <p className="text-xs text-slate-400">Priorité #{article.priority}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 2 : Commit**

```bash
git add src/app/admin/blog/_components/ArticleQueueList.tsx
git commit -m "feat: ArticleQueueList component with priority display"
```

---

## Task 6 : Composant IntegrationsPanel

**Fichiers :**
- Créer : `src/app/admin/blog/_components/IntegrationsPanel.tsx`

**Step 1 : Créer le composant**

```tsx
// src/app/admin/blog/_components/IntegrationsPanel.tsx

interface IntegrationCardProps {
  name: string;
  description: string;
  metrics: string[];
  logoSrc: string;
  accentColor: string;
}

function IntegrationCard({ name, description, metrics, logoSrc, accentColor }: IntegrationCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoSrc} alt={name} className="w-8 h-8 object-contain" />
          <div>
            <p className="text-sm font-bold text-slate-900">{name}</p>
            <p className="text-xs text-slate-400">{description}</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
          Prochainement
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {metrics.map((metric) => (
          <div key={metric} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: accentColor }} />
            <span className="text-xs text-slate-500 font-medium">{metric}</span>
          </div>
        ))}
      </div>

      <button
        disabled
        className="w-full py-2.5 rounded-xl text-sm font-semibold text-slate-400 border border-slate-100 bg-slate-50 cursor-not-allowed"
      >
        Connecter {name}
      </button>
    </div>
  );
}

export default function IntegrationsPanel() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="w-8 h-px bg-slate-200" />
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Intégrations à venir</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <IntegrationCard
          name="Google Search Console"
          description="Positions, clics et impressions Google"
          metrics={["Position moyenne", "Clics organiques", "Impressions", "CTR"]}
          logoSrc="https://www.gstatic.com/images/branding/product/2x/search_console_48dp.png"
          accentColor="#4285F4"
        />
        <IntegrationCard
          name="Google Analytics 4"
          description="Trafic, sessions et comportement utilisateurs"
          metrics={["Visiteurs uniques", "Sessions", "Taux de rebond", "Durée moyenne"]}
          logoSrc="https://www.gstatic.com/analytics-suite/header/suite/v2/ic_analytics.svg"
          accentColor="#F9AB00"
        />
      </div>
    </div>
  );
}
```

**Step 2 : Commit**

```bash
git add src/app/admin/blog/_components/IntegrationsPanel.tsx
git commit -m "feat: IntegrationsPanel with GSC + GA4 placeholder cards"
```

---

## Task 7 : Page principale `/admin/blog`

**Fichiers :**
- Créer : `src/app/admin/blog/page.tsx`

**Step 1 : Créer la page**

```tsx
// src/app/admin/blog/page.tsx
import { Metadata } from "next";
import { readFile } from "fs/promises";
import path from "path";
import type { ArticleQueueItem } from "./types";
import KpiBar from "./_components/KpiBar";
import PublishedArticlesTable from "./_components/PublishedArticlesTable";
import ArticleQueueList from "./_components/ArticleQueueList";
import IntegrationsPanel from "./_components/IntegrationsPanel";

export const metadata: Metadata = {
  title: "Blog & Articles — Vanzon Admin",
  robots: { index: false, follow: false },
};

async function getArticleQueue(): Promise<ArticleQueueItem[]> {
  try {
    const queuePath = path.resolve(process.cwd(), "scripts/data/article-queue.json");
    const raw = await readFile(queuePath, "utf-8");
    return JSON.parse(raw) as ArticleQueueItem[];
  } catch {
    return [];
  }
}

export default async function AdminBlogPage() {
  const articles = await getArticleQueue();
  const publishedCount = articles.filter((a) => a.status === "published").length;
  const pendingCount = articles.filter((a) => a.status === "pending" || a.status === "writing").length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">Administration</p>
          <h1 className="text-3xl font-black text-slate-900">Blog & Articles</h1>
          <p className="text-slate-500 mt-1">
            {publishedCount} publié{publishedCount > 1 ? "s" : ""} · {pendingCount} en attente
          </p>
        </div>
        <a
          href="/studio/structure/article"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-semibold text-white text-sm px-5 py-2.5 rounded-xl transition-all"
          style={{ background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)", boxShadow: "0 4px 14px rgba(99,102,241,0.35)" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Sanity Studio
        </a>
      </div>

      {/* KPIs */}
      <KpiBar articles={articles} />

      {/* Articles publiés */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-8 h-px bg-slate-200" />
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Articles publiés</span>
        </div>
        <PublishedArticlesTable articles={articles} />
      </div>

      {/* File d'attente */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-8 h-px bg-slate-200" />
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">File d&apos;attente</span>
        </div>
        <ArticleQueueList articles={articles} />
      </div>

      {/* Intégrations */}
      <IntegrationsPanel />
    </div>
  );
}
```

**Step 2 : Commit**

```bash
git add src/app/admin/blog/page.tsx
git commit -m "feat: /admin/blog page — blog dashboard"
```

---

## Task 8 : Ajouter le lien dans AdminSidebar

**Fichiers :**
- Modifier : `src/app/admin/_components/AdminSidebar.tsx`

**Step 1 : Ajouter l'entrée dans le tableau `nav`**

Dans `AdminSidebar.tsx`, localise le tableau `nav`. Ajoute l'entrée "Blog & Articles" après "SEO Analytics" :

```typescript
{
  label: "Blog & Articles",
  href: "/admin/blog",
  icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 12h6" />
    </svg>
  ),
},
```

**Step 2 : Vérifier visuellement**

Lancer `npm run dev` et naviguer vers `http://localhost:3000/admin/blog`. Vérifier :
- Le lien apparaît dans la sidebar
- La page affiche les KPIs, la table des publiés, la file d'attente, les intégrations
- Les statuts ont les bonnes couleurs
- Aucune erreur TypeScript

**Step 3 : Commit final**

```bash
git add src/app/admin/_components/AdminSidebar.tsx
git commit -m "feat: add Blog & Articles to admin sidebar"
```

---

## Résultat attendu

`http://localhost:3000/admin/blog` affiche :
1. **KPI Bar** : 1 publié, 21 en attente, 0 à améliorer, `--` pour les métriques GSC/GA4
2. **Table articles publiés** : `road-trip-pays-basque-van` avec badge "Publié" + toutes métriques `--`
3. **File d'attente** : 21 articles triés par priorité avec dates estimées
4. **Intégrations** : 2 cartes GSC + GA4 avec boutons désactivés

## Secrets GitHub à configurer (rappel)

Ces secrets sont nécessaires pour que les GitHub Actions fonctionnent (tâche séparée) :
- `ANTHROPIC_API_KEY`
- `SANITY_API_WRITE_TOKEN`
- `PEXELS_API_KEY`
- `DATAFORSEO_LOGIN`
- `DATAFORSEO_PASSWORD`
