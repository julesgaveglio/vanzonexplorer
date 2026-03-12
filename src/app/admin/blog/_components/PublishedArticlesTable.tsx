import type { ArticleQueueItem, GscMetrics } from "../types";
import { CATEGORY_COLORS, STATUS_CONFIG } from "../types";

interface PublishedArticlesTableProps {
  articles: ArticleQueueItem[];
  gscMetrics?: Record<string, GscMetrics>;
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
      <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <h2 className="font-bold text-slate-900">Articles publiés</h2>
          <span className="text-xs text-slate-400 font-medium">{published.length} article{published.length > 1 ? "s" : ""}</span>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-full">
          Google Search Console non connecté
        </span>
      </div>
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
              const catColor = CATEGORY_COLORS[article.category] ?? { bg: "bg-slate-50", text: "text-slate-600" };
              const statusCfg = STATUS_CONFIG[article.status];
              return (
                <tr key={article.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 max-w-[280px]">
                    <a href={`/vanzon/articles/${article.slug}`} target="_blank" rel="noopener noreferrer"
                      className="text-sm font-semibold text-slate-800 hover:text-blue-600 transition-colors line-clamp-2">
                      {article.title}
                    </a>
                    {article.publishedAt && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {new Date(article.publishedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${catColor.bg} ${catColor.text}`}>{article.category}</span>
                  </td>
                  <td className="px-4 py-4 max-w-[160px]">
                    <span className="text-xs text-slate-600 font-mono bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 line-clamp-1">{article.targetKeyword}</span>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {metrics?.position ? (
                      <span className={`text-sm font-bold ${metrics.position <= 10 ? "text-green-600" : metrics.position <= 20 ? "text-amber-600" : "text-red-500"}`}>#{metrics.position}</span>
                    ) : article.seoPosition ? (
                      <span className={`text-sm font-bold ${article.seoPosition <= 10 ? "text-green-600" : article.seoPosition <= 20 ? "text-amber-600" : "text-red-500"}`}>#{article.seoPosition}</span>
                    ) : (
                      <span className="text-slate-300 text-sm font-medium">--</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center"><span className="text-slate-300 text-sm font-medium">{metrics?.clicks ?? "--"}</span></td>
                  <td className="px-4 py-4 text-center"><span className="text-slate-300 text-sm font-medium">{metrics?.impressions ?? "--"}</span></td>
                  <td className="px-4 py-4 text-center"><span className="text-slate-300 text-sm font-medium">{metrics?.ctr ? `${(metrics.ctr * 100).toFixed(1)}%` : "--"}</span></td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${statusCfg.bg} ${statusCfg.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                      {statusCfg.label}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <a href={`/vanzon/articles/${article.slug}`} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors">
                        Voir
                      </a>
                      {article.sanityId && (
                        <a href={`/vanzon/studio/structure/article;${article.sanityId}`} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-purple-600 bg-slate-50 hover:bg-purple-50 px-2.5 py-1.5 rounded-lg transition-colors">
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
