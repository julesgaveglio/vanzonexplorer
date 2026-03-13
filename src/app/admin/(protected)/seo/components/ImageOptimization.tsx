"use client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ImageData {
  total?: number;
  noAlt?: string[];
  nonOptimized?: string[];
  tooHeavy?: Array<{ url: string; sizeKb: number }>;
  error?: string;
}

export function ImageOptimization() {
  const { data, isLoading } = useSWR<ImageData>(
    "/api/admin/seo/images",
    fetcher,
    { refreshInterval: 3600000 }
  );

  const kpis = [
    {
      label: "Sans alt",
      count: data?.noAlt?.length ?? 0,
      color: "from-red-500 to-rose-400",
      icon: "🖼️",
      tip: "Manquent d'attribut alt",
    },
    {
      label: "Format non-optimisé",
      count: data?.nonOptimized?.length ?? 0,
      color: "from-amber-500 to-orange-400",
      icon: "📦",
      tip: "Pas en WebP/AVIF",
    },
    {
      label: "Trop lourdes",
      count: data?.tooHeavy?.length ?? 0,
      color: "from-violet-500 to-purple-400",
      icon: "⚖️",
      tip: "> 200 KB",
    },
  ];

  const problems: Array<{ url: string; type: string; detail?: string }> = [
    ...(data?.noAlt ?? []).map((url) => ({ url, type: "Sans alt" })),
    ...(data?.tooHeavy ?? []).map(({ url, sizeKb }) => ({ url, type: "Trop lourde", detail: `${sizeKb} KB` })),
  ].slice(0, 8);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
        <span>🖼️</span>
        <h2 className="font-bold text-slate-900">Optimisation Images</h2>
        <span className="text-xs bg-rose-100 text-rose-600 font-semibold px-2 py-0.5 rounded-full ml-auto">
          {data?.total ?? 0} images
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <div className="w-5 h-5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data?.error ? (
        <p className="px-6 py-6 text-center text-slate-400 text-sm">{data.error}</p>
      ) : (
        <div className="p-4 space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-3 gap-2">
            {kpis.map(({ label, count, color, icon, tip }) => (
              <div key={label} className="rounded-xl bg-slate-50 p-2.5 text-center">
                <p className="text-sm">{icon}</p>
                <p className={`text-lg font-black bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
                  {count}
                </p>
                <p className="text-xs font-semibold text-slate-600">{label}</p>
                <p className="text-xs text-slate-400">{tip}</p>
              </div>
            ))}
          </div>

          {/* Liste des problèmes */}
          {problems.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Images à corriger
              </p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {problems.map((p) => (
                  <div key={`${p.url}-${p.type}`} className="flex items-center gap-2 text-xs">
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full font-medium ${
                        p.type === "Sans alt"
                          ? "bg-red-100 text-red-600"
                          : "bg-violet-100 text-violet-600"
                      }`}
                    >
                      {p.type}
                      {p.detail ? ` · ${p.detail}` : ""}
                    </span>
                    <span className="text-slate-500 truncate">{p.url}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {problems.length === 0 && (
            <p className="text-center text-sm text-emerald-600 font-medium">
              ✓ Aucun problème détecté
            </p>
          )}
        </div>
      )}
    </div>
  );
}
