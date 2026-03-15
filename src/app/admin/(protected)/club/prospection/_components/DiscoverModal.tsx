"use client";

import { useState, useRef, useEffect } from "react";

export interface ProspectCandidate {
  name: string;
  website: string;
  category: string;
  type: string;
  country: string;
  description: string;
  relevance_score: number;
  strategic_interest: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (prospects: ProspectCandidate[]) => void;
}

const CATEGORIES = ["froid","énergie","chauffage","sanitaire","extérieur","accessoires","distributeur","tendance"];

export default function DiscoverModal({ open, onClose, onAdd }: Props) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [country, setCountry] = useState<"France" | "Europe">("France");
  const [isSearching, setIsSearching] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [results, setResults] = useState<ProspectCandidate[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const logsEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    if (!open) {
      abortRef.current?.abort();
    }
    return () => {
      abortRef.current?.abort();
    };
  }, [open]);

  if (!open) return null;

  function toggleCategory(cat: string) {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  }

  function toggleSelected(website: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(website)) next.delete(website);
      else next.add(website);
      return next;
    });
  }

  async function handleSearch() {
    if (selectedCategories.length === 0) return;
    setIsSearching(true);
    setLogs([]);
    setResults([]);
    setSelected(new Set());

    abortRef.current = new AbortController();

    try {
      const response = await fetch("/api/admin/club/prospect/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: selectedCategories, country }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        setLogs(prev => [...prev, `Erreur HTTP ${response.status}`]);
        setIsSearching(false);
        return;
      }
      if (!response.body) {
        setLogs(prev => [...prev, 'Pas de flux SSE disponible']);
        setIsSearching(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split("\n").filter(l => l.startsWith("data: "));
        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "log") setLogs(prev => [...prev, data.message]);
            if (data.type === "result") setResults(data.prospects);
            if (data.type === "done") setIsSearching(false);
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setLogs(prev => [...prev, `Erreur: ${String(err)}`]);
      setIsSearching(false);
    }
  }

  function handleAdd() {
    const toAdd = results.filter(r => selected.has(r.website));
    onAdd(toAdd);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Découvrir des marques</h2>
          <button onClick={onClose} aria-label="Fermer" className="text-slate-400 hover:text-slate-600 text-xl font-light leading-none">×</button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Categories */}
          <div>
            <div className="text-sm font-medium text-slate-700 mb-2">Catégories</div>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(cat => (
                <label key={cat} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={() => toggleCategory(cat)}
                    className="w-4 h-4 accent-violet-600"
                  />
                  <span className="text-sm text-slate-700 capitalize">{cat}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Country toggle */}
          <div>
            <div className="text-sm font-medium text-slate-700 mb-2">Marché</div>
            <div className="flex gap-2">
              {(["France", "Europe"] as const).map(c => (
                <button
                  key={c}
                  onClick={() => setCountry(c)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    country === c
                      ? "text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                  style={country === c ? { background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)" } : undefined}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Search button */}
          <button
            onClick={handleSearch}
            disabled={isSearching || selectedCategories.length === 0}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)" }}
          >
            {isSearching ? "Recherche en cours..." : "Lancer la recherche"}
          </button>

          {/* Logs */}
          {logs.length > 0 && (
            <div className="bg-slate-900 rounded-xl p-4 max-h-40 overflow-y-auto font-mono text-xs text-slate-300 space-y-1">
              {logs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div>
              <div className="text-sm font-medium text-slate-700 mb-3">
                {results.length} marques trouvées
              </div>
              <div className="grid grid-cols-2 gap-3">
                {results.map(r => (
                  <label
                    key={r.website}
                    className={`cursor-pointer rounded-xl border-2 p-3 transition-colors ${
                      selected.has(r.website)
                        ? "border-violet-400 bg-violet-50"
                        : "border-slate-100 bg-white hover:border-slate-200"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={selected.has(r.website)}
                        onChange={() => toggleSelected(r.website)}
                        className="mt-0.5 w-4 h-4 accent-violet-600 flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-800 truncate">{r.name}</div>
                        <div className="text-xs text-slate-400 truncate">{r.website}</div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700">
                            {r.category}
                          </span>
                          <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                            r.relevance_score >= 80 ? "bg-emerald-50 text-emerald-700" :
                            r.relevance_score >= 60 ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"
                          }`}>
                            {r.relevance_score}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1.5 line-clamp-2">{r.description}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {selected.size > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleAdd}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)" }}
            >
              Ajouter {selected.size} marque{selected.size > 1 ? "s" : ""} sélectionnée{selected.size > 1 ? "s" : ""}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
