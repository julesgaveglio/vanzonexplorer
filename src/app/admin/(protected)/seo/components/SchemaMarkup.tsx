"use client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface SchemaResult {
  url: string;
  detected: Array<{ type: string; present: boolean }>;
  error?: string;
}

const KEY_PAGES = [
  { label: "Homepage", url: "https://vanzonexplorer.com/vanzon" },
  { label: "Location", url: "https://vanzonexplorer.com/vanzon/location" },
  { label: "Achat", url: "https://vanzonexplorer.com/vanzon/achat" },
  { label: "Formation", url: "https://vanzonexplorer.com/vanzon/formation" },
  { label: "Pays Basque", url: "https://vanzonexplorer.com/vanzon/pays-basque" },
];

function PageRow({ label, url }: { label: string; url: string }) {
  const { data, isLoading } = useSWR<SchemaResult>(
    `/api/admin/seo/schema?url=${encodeURIComponent(url)}`,
    fetcher,
    { refreshInterval: 3600000 }
  );

  return (
    <tr className="border-t border-slate-50">
      <td className="px-4 py-3 text-sm font-semibold text-slate-700 w-32">{label}</td>
      <td className="px-4 py-3">
        {isLoading ? (
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-20 h-5 bg-slate-100 rounded-full animate-pulse" />
            ))}
          </div>
        ) : data?.error ? (
          <span className="text-xs text-red-400">Erreur</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {(data?.detected ?? []).map(({ type, present }) => (
              <span
                key={type}
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  present
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {present ? "✓" : "○"} {type}
              </span>
            ))}
          </div>
        )}
      </td>
    </tr>
  );
}

export function SchemaMarkup() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
        <span>🏷️</span>
        <h2 className="font-bold text-slate-900">Schema Markup</h2>
        <span className="text-xs bg-emerald-100 text-emerald-600 font-semibold px-2 py-0.5 rounded-full ml-auto">
          Structured Data
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Page
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Schemas
              </th>
            </tr>
          </thead>
          <tbody>
            {KEY_PAGES.map((page) => (
              <PageRow key={page.url} {...page} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
