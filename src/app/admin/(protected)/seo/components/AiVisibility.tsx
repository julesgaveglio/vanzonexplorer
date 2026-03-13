"use client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface AiData {
  available: boolean;
  reason?: string;
  metrics?: {
    visibility_score?: number;
    mentions_count?: number;
    impressions_count?: number;
    llm_mentions?: Record<string, number>;
  };
  topPages?: Array<{ url?: string; mentions_count?: number }>;
  error?: string;
}

const LLM_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  perplexity: "Perplexity",
  claude: "Claude",
};

export function AiVisibility() {
  const { data, isLoading } = useSWR<AiData>(
    "/api/admin/seo/ai-visibility",
    fetcher,
    { refreshInterval: 3600000 }
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
        <span>🤖</span>
        <h2 className="font-bold text-slate-900">Visibilité IA</h2>
        <span className="text-xs bg-violet-100 text-violet-600 font-semibold px-2 py-0.5 rounded-full ml-auto">
          LLM Mentions
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data?.error ? (
        <p className="px-6 py-8 text-center text-slate-400 text-sm">{data.error}</p>
      ) : !data?.available ? (
        <div className="px-6 py-8 text-center">
          <p className="text-slate-400 text-sm mb-2">Données non disponibles</p>
          <p className="text-slate-300 text-xs">
            Le domaine vanzonexplorer.com n&apos;est pas encore suivi dans DataForSEO AI Visibility.
          </p>
        </div>
      ) : (
        <div className="p-6 space-y-5">
          {/* Score global */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-violet-50">
            <div className="text-3xl font-black text-violet-600">
              {data.metrics?.visibility_score ?? 0}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Score de visibilité IA</p>
              <p className="text-xs text-slate-500">
                {data.metrics?.mentions_count ?? 0} mentions · {data.metrics?.impressions_count ?? 0} impressions
              </p>
            </div>
          </div>

          {/* Par LLM */}
          {data.metrics?.llm_mentions && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Mentions par LLM
              </p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(data.metrics.llm_mentions).map(([llm, count]) => (
                  <div key={llm} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                    <span className="text-sm font-medium text-slate-700">
                      {LLM_LABELS[llm] ?? llm}
                    </span>
                    <span className="text-sm font-bold text-violet-600">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top pages */}
          {data.topPages && data.topPages.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Pages les plus mentionnées
              </p>
              <div className="space-y-1">
                {data.topPages.slice(0, 3).map((page, i) => (
                  <div key={page.url ?? String(i)} className="flex items-center gap-2 text-xs">
                    <span className="text-violet-400 font-bold">{i + 1}.</span>
                    <span className="flex-1 text-slate-600 truncate">
                      {(page.url ?? "").replace("https://vanzonexplorer.com", "") || "/"}
                    </span>
                    <span className="text-slate-400 shrink-0">{page.mentions_count} mentions</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
