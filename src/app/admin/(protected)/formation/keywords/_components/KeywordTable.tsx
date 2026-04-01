"use client";

interface VbaKeyword {
  id: string;
  keyword: string;
  search_volume: number;
  keyword_difficulty: number | null;
  cpc: number;
  intent: string | null;
  topic_cluster: string | null;
  opportunity_score: number | null;
  competition_level: string | null;
}

function DifficultyBadge({ value }: { value: number | null }) {
  const v = value ?? 50;
  const color = v < 30 ? "bg-green-100 text-green-700" : v < 60 ? "bg-orange-100 text-orange-700" : "bg-red-100 text-red-700";
  const label = v < 30 ? "Facile" : v < 60 ? "Moyen" : "Difficile";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {Math.round(v)} — {label}
    </span>
  );
}

function IntentBadge({ intent }: { intent: string | null }) {
  if (!intent) return <span className="text-slate-400">—</span>;
  const colors: Record<string, string> = {
    informational: "bg-blue-50 text-blue-600",
    commercial: "bg-purple-50 text-purple-600",
    transactional: "bg-emerald-50 text-emerald-700",
    navigational: "bg-slate-100 text-slate-600",
  };
  const labels: Record<string, string> = {
    informational: "Info",
    commercial: "Commercial",
    transactional: "Achat",
    navigational: "Navigation",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${colors[intent] ?? "bg-slate-100 text-slate-600"}`}>
      {labels[intent] ?? intent}
    </span>
  );
}

function ScoreBar({ score }: { score: number | null }) {
  const v = score ?? 0;
  const color = v >= 70 ? "bg-emerald-500" : v >= 40 ? "bg-blue-500" : "bg-slate-300";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(v, 100)}%` }} />
      </div>
      <span className="text-xs font-mono text-slate-600">{v}</span>
    </div>
  );
}

export default function KeywordTable({ keywords }: { keywords: VbaKeyword[] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Mot-clé</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Volume</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Difficulté</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">CPC €</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Intent</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cluster</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Score</th>
            </tr>
          </thead>
          <tbody>
            {keywords.map((kw) => (
              <tr key={kw.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <span className="font-medium text-slate-900">{kw.keyword}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-mono text-slate-700">{(kw.search_volume ?? 0).toLocaleString("fr-FR")}</span>
                </td>
                <td className="px-4 py-3">
                  <DifficultyBadge value={kw.keyword_difficulty} />
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="font-mono text-slate-600">{kw.cpc ? `${kw.cpc.toFixed(2)} €` : "—"}</span>
                </td>
                <td className="px-4 py-3">
                  <IntentBadge intent={kw.intent} />
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">{kw.topic_cluster ?? "—"}</span>
                </td>
                <td className="px-4 py-3">
                  <ScoreBar score={kw.opportunity_score} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
