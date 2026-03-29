import type { Metadata } from "next";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import PinterestResearchButton from "./_components/PinterestResearchButton";
import ContentQueueTable from "./_components/ContentQueueTable";
import PinterestCharts from "./_components/PinterestCharts";

export const metadata: Metadata = {
  title: "Pinterest — Vanzon Admin",
  robots: { index: false, follow: false },
};

export default async function PinterestPage() {
  const supabase = createSupabaseAdmin();

  const [boardsRes, keywordsRes, recsRes, queueRes] = await Promise.all([
    supabase
      .from("pinterest_boards")
      .select("*")
      .order("pin_count", { ascending: false })
      .limit(20),
    supabase
      .from("pinterest_keyword_opportunities")
      .select("*")
      .order("recommended_priority", { ascending: false }),
    supabase
      .from("pinterest_board_recommendations")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("pinterest_content_queue")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const boards = boardsRes.data ?? [];
  const keywords = keywordsRes.data ?? [];
  const recs = recsRes.data ?? [];
  const queue = queueRes.data ?? [];

  const queueByStatus = {
    draft: queue.filter((q) => q.status === "draft").length,
    approved: queue.filter((q) => q.status === "approved").length,
    published: queue.filter((q) => q.status === "published").length,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Pinterest Strategy</h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Trial — Lecture seule
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Analyse des opportunités Pinterest pour Vanzon Explorer. Posting activé après upgrade Standard.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Boards",
            value: boards.length,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            ),
            color: "text-red-600 bg-red-50",
          },
          {
            label: "Keywords analysés",
            value: keywords.length,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            ),
            color: "text-blue-600 bg-blue-50",
          },
          {
            label: "Content queue",
            value: queue.length,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            ),
            color: "text-violet-600 bg-violet-50",
          },
          {
            label: "Recommandations",
            value: recs.length,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            ),
            color: "text-emerald-600 bg-emerald-50",
          },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${kpi.color}`}>
              {kpi.icon}
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900">{kpi.value}</p>
            <p className="text-sm text-slate-500">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Actions</h2>
        <PinterestResearchButton />
      </div>

      {/* Keyword opportunities chart */}
      {keywords.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">
            Opportunités keywords — priorité recommandée
          </h2>
          <PinterestCharts keywords={keywords} />
        </div>
      )}

      {/* Boards */}
      {boards.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Boards Pinterest</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Nom</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Pins</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Abonnés</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Récupéré le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {boards.map((board) => (
                  <tr key={board.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-medium text-slate-800">{board.name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{board.pin_count.toLocaleString("fr-FR")}</td>
                    <td className="py-2.5 px-3 text-slate-600">{board.follower_count.toLocaleString("fr-FR")}</td>
                    <td className="py-2.5 px-3 text-slate-400 text-xs">
                      {new Date(board.fetched_at).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Keyword Opportunities table */}
      {keywords.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Keywords analysés</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Keyword</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Pins</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Compétition</th>
                  <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Priorité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {keywords.map((kw) => (
                  <tr key={kw.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-medium text-slate-800">{kw.keyword}</td>
                    <td className="py-2.5 px-3 text-slate-600">{kw.pin_count}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        kw.competition_level === "low"
                          ? "bg-emerald-100 text-emerald-700"
                          : kw.competition_level === "medium"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {kw.competition_level === "low" ? "Faible" : kw.competition_level === "medium" ? "Moyenne" : "Élevée"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-100 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{ width: `${(kw.recommended_priority / 10) * 100}%` }}
                          />
                        </div>
                        <span className="text-slate-600 text-xs">{kw.recommended_priority}/10</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Board Recommendations */}
      {recs.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Boards recommandés par l&apos;IA</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recs.map((rec) => (
              <div key={rec.id} className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-medium text-slate-800 text-sm">{rec.board_name}</h3>
                  <span className={`shrink-0 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                    rec.status === "active"
                      ? "bg-emerald-100 text-emerald-700"
                      : rec.status === "created"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    {rec.status === "active" ? "Actif" : rec.status === "created" ? "Créé" : "Suggéré"}
                  </span>
                </div>
                {rec.description && (
                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">{rec.description}</p>
                )}
                {rec.target_keywords?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(rec.target_keywords as string[]).slice(0, 3).map((kw: string) => (
                      <span key={kw} className="px-1.5 py-0.5 bg-red-50 text-red-700 text-xs rounded">
                        {kw}
                      </span>
                    ))}
                    {rec.target_keywords.length > 3 && (
                      <span className="text-xs text-slate-400">+{rec.target_keywords.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Queue */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-900">Content Queue</h2>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>{queueByStatus.draft} brouillons</span>
            <span>•</span>
            <span>{queueByStatus.approved} approuvés</span>
            <span>•</span>
            <span>{queueByStatus.published} publiés</span>
          </div>
        </div>
        <ContentQueueTable items={queue} />
      </div>
    </div>
  );
}
