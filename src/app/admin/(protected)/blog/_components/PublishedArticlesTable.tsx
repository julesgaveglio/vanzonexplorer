import type { ArticleQueueItem, GscMetrics, GaMetrics } from "../types";
import { CATEGORY_COLORS, STATUS_CONFIG } from "../types";

interface PublishedArticlesTableProps {
  articles: ArticleQueueItem[];
  gscMetrics?: Record<string, GscMetrics>;
  gaMetrics?: Record<string, GaMetrics>;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m${s > 0 ? `${s}s` : ""}`;
}

export default function PublishedArticlesTable({ articles, gscMetrics = {}, gaMetrics = {} }: PublishedArticlesTableProps) {
  const published = articles.filter((a) => a.status === "published" || a.status === "needs-improvement");
  const gscConnected = Object.keys(gscMetrics).length > 0;
  const gaConnected = Object.keys(gaMetrics).length > 0;

  if (published.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
        <p className="text-slate-400 text-sm">Aucun article publié pour l&apos;instant.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-4 md:px-6 py-4 border-b border-slate-50 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <h2 className="font-bold text-slate-900">Articles publiés</h2>
          <span className="text-xs text-slate-400 font-medium">{published.length} article{published.length > 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium ${gscConnected ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-slate-50 text-slate-400 border-slate-100"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${gscConnected ? "bg-blue-500" : "bg-slate-300"}`} />
            GSC {gscConnected ? "actif" : "non connecté"}
          </span>
          <span className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium ${gaConnected ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-slate-50 text-slate-400 border-slate-100"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${gaConnected ? "bg-amber-400" : "bg-slate-300"}`} />
            GA4 {gaConnected ? "actif" : "non connecté"}
          </span>
        </div>
      </div>

      {/* Mobile view */}
      <div className="block md:hidden divide-y divide-slate-50">
        {published.map((article) => {
          const gsc = gscMetrics[article.slug];
          const ga = gaMetrics[article.slug];
          const catColor = CATEGORY_COLORS[article.category] ?? { bg: "bg-slate-50", text: "text-slate-600" };
          const statusCfg = STATUS_CONFIG[article.status];
          return (
            <div key={article.id} className="px-4 py-4 border-b border-slate-50 last:border-0">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <a
                    href={`/vanzon/articles/${article.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-bold text-slate-800 hover:text-blue-600 line-clamp-2"
                  >
                    {article.title}
                  </a>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {article.publishedAt
                      ? new Date(article.publishedAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {gsc?.position ? (
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        gsc.position <= 10
                          ? "bg-green-50 text-green-700"
                          : gsc.position <= 20
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      #{Math.round(gsc.position)}
                    </span>
                  ) : article.seoPosition ? (
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        article.seoPosition <= 10
                          ? "bg-green-50 text-green-700"
                          : article.seoPosition <= 20
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      #{article.seoPosition}
                    </span>
                  ) : null}
                </div>
              </div>
              {/* Category + keyword */}
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${catColor.bg} ${catColor.text}`}>
                  {article.category}
                </span>
                <span className="text-xs text-slate-500 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100 truncate max-w-[180px]">
                  {article.targetKeyword}
                </span>
              </div>
              {/* GSC + GA4 metrics row */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="text-center bg-blue-50/60 rounded-lg py-1.5">
                  <p className="text-xs text-blue-400 font-medium">Clics</p>
                  <p className="text-sm font-bold text-blue-700">{gsc?.clicks ?? "--"}</p>
                </div>
                <div className="text-center bg-blue-50/60 rounded-lg py-1.5">
                  <p className="text-xs text-blue-400 font-medium">Impr.</p>
                  <p className="text-sm font-bold text-blue-700">{gsc?.impressions ?? "--"}</p>
                </div>
                <div className="text-center bg-amber-50/60 rounded-lg py-1.5">
                  <p className="text-xs text-amber-500 font-medium">Sessions</p>
                  <p className="text-sm font-bold text-amber-700">{ga?.sessions ?? "--"}</p>
                </div>
                <div className="text-center bg-amber-50/60 rounded-lg py-1.5">
                  <p className="text-xs text-amber-500 font-medium">Rebond</p>
                  <p className="text-sm font-bold text-amber-700">
                    {ga?.bounceRate != null ? `${ga.bounceRate}%` : "--"}
                  </p>
                </div>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-2">
                <a
                  href={`/vanzon/articles/${article.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-slate-500 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Voir
                </a>
                {article.sanityId && (
                  <a
                    href={`/vanzon/studio/structure/article;${article.sanityId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-slate-500 bg-slate-50 hover:bg-purple-50 hover:text-purple-600 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Sanity
                  </a>
                )}
                <span
                  className={`ml-auto inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.text}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                  {statusCfg.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-50">
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3">Article</th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Catégorie</th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Keyword cible</th>
              {/* GSC */}
              <th className="text-center text-xs font-semibold text-blue-400 uppercase tracking-wider px-3 py-3">Position</th>
              <th className="text-center text-xs font-semibold text-blue-400 uppercase tracking-wider px-3 py-3">Clics</th>
              <th className="text-center text-xs font-semibold text-blue-400 uppercase tracking-wider px-3 py-3">Impr.</th>
              <th className="text-center text-xs font-semibold text-blue-400 uppercase tracking-wider px-3 py-3">CTR</th>
              {/* GA4 */}
              <th className="text-center text-xs font-semibold text-amber-500 uppercase tracking-wider px-3 py-3">Sessions</th>
              <th className="text-center text-xs font-semibold text-amber-500 uppercase tracking-wider px-3 py-3">Pages vues</th>
              <th className="text-center text-xs font-semibold text-amber-500 uppercase tracking-wider px-3 py-3">Durée moy.</th>
              <th className="text-center text-xs font-semibold text-amber-500 uppercase tracking-wider px-3 py-3">Rebond</th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Statut</th>
              <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {published.map((article) => {
              const gsc = gscMetrics[article.slug];
              const ga = gaMetrics[article.slug];
              const catColor = CATEGORY_COLORS[article.category] ?? { bg: "bg-slate-50", text: "text-slate-600" };
              const statusCfg = STATUS_CONFIG[article.status];
              return (
                <tr key={article.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 max-w-[240px]">
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
                  <td className="px-4 py-4 max-w-[140px]">
                    <span className="text-xs text-slate-600 font-mono bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 line-clamp-1">{article.targetKeyword}</span>
                  </td>
                  {/* GSC columns */}
                  <td className="px-3 py-4 text-center">
                    {gsc?.position ? (
                      <span className={`text-sm font-bold ${gsc.position <= 10 ? "text-green-600" : gsc.position <= 20 ? "text-amber-600" : "text-red-500"}`}>#{gsc.position}</span>
                    ) : article.seoPosition ? (
                      <span className={`text-sm font-bold ${article.seoPosition <= 10 ? "text-green-600" : article.seoPosition <= 20 ? "text-amber-600" : "text-red-500"}`}>#{article.seoPosition}</span>
                    ) : (
                      <span className="text-slate-300 text-sm">--</span>
                    )}
                  </td>
                  <td className="px-3 py-4 text-center">
                    <span className={`text-sm font-medium ${gsc?.clicks ? "text-slate-700" : "text-slate-300"}`}>{gsc?.clicks ?? "--"}</span>
                  </td>
                  <td className="px-3 py-4 text-center">
                    <span className={`text-sm font-medium ${gsc?.impressions ? "text-slate-700" : "text-slate-300"}`}>{gsc?.impressions ?? "--"}</span>
                  </td>
                  <td className="px-3 py-4 text-center">
                    <span className={`text-sm font-medium ${gsc?.ctr ? "text-slate-700" : "text-slate-300"}`}>{gsc?.ctr ? `${(gsc.ctr * 100).toFixed(1)}%` : "--"}</span>
                  </td>
                  {/* GA4 columns */}
                  <td className="px-3 py-4 text-center">
                    <span className={`text-sm font-medium ${ga?.sessions ? "text-amber-700" : "text-slate-300"}`}>{ga?.sessions ?? "--"}</span>
                  </td>
                  <td className="px-3 py-4 text-center">
                    <span className={`text-sm font-medium ${ga?.pageviews ? "text-amber-700" : "text-slate-300"}`}>{ga?.pageviews ?? "--"}</span>
                  </td>
                  <td className="px-3 py-4 text-center">
                    <span className={`text-sm font-medium ${ga?.avgDuration ? "text-amber-700" : "text-slate-300"}`}>{ga?.avgDuration ? formatDuration(ga.avgDuration) : "--"}</span>
                  </td>
                  <td className="px-3 py-4 text-center">
                    {ga?.bounceRate != null ? (
                      <span className={`text-sm font-medium ${ga.bounceRate <= 40 ? "text-green-600" : ga.bounceRate <= 65 ? "text-amber-600" : "text-red-500"}`}>{ga.bounceRate}%</span>
                    ) : (
                      <span className="text-slate-300 text-sm">--</span>
                    )}
                  </td>
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
