"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { REGION_CENTROIDS } from "./regionData";

export interface SearchSuggestion {
  id: string;
  label: string;
  sublabel?: string;
  coords: [number, number];
  zoom: number;
  type: "region" | "city";
  regionSlug?: string;
}

interface ArticleMin {
  _id: string;
  title: string;
  regionSlug: string;
  regionName: string;
}

interface SearchBarProps {
  articles: ArticleMin[];
  onSelect: (s: SearchSuggestion) => void;
  onClear: () => void;
}

const FRENCH_CITIES: Array<{ name: string; coords: [number, number]; zoom: number }> = [
  { name: "Paris",                   coords: [ 2.3522,  48.8566], zoom: 9  },
  { name: "Lyon",                    coords: [ 4.8357,  45.7640], zoom: 9  },
  { name: "Marseille",               coords: [ 5.3698,  43.2965], zoom: 9  },
  { name: "Bordeaux",                coords: [-0.5792,  44.8378], zoom: 9  },
  { name: "Toulouse",                coords: [ 1.4442,  43.6047], zoom: 9  },
  { name: "Nice",                    coords: [ 7.2620,  43.7102], zoom: 9  },
  { name: "Nantes",                  coords: [-1.5534,  47.2184], zoom: 9  },
  { name: "Strasbourg",              coords: [ 7.7521,  48.5734], zoom: 9  },
  { name: "Montpellier",             coords: [ 3.8767,  43.6108], zoom: 9  },
  { name: "Rennes",                  coords: [-1.6778,  48.1147], zoom: 9  },
  { name: "Lille",                   coords: [ 3.0573,  50.6292], zoom: 9  },
  { name: "Reims",                   coords: [ 4.0317,  49.2583], zoom: 9  },
  { name: "Dijon",                   coords: [ 5.0415,  47.3220], zoom: 9  },
  { name: "Clermont-Ferrand",        coords: [ 3.0863,  45.7772], zoom: 9  },
  { name: "Limoges",                 coords: [ 1.2578,  45.8336], zoom: 9  },
  { name: "Poitiers",                coords: [ 0.3404,  46.5802], zoom: 9  },
  { name: "Tours",                   coords: [ 0.6833,  47.3941], zoom: 9  },
  { name: "Grenoble",                coords: [ 5.7245,  45.1885], zoom: 9  },
  { name: "Rouen",                   coords: [ 1.0993,  49.4432], zoom: 9  },
  { name: "Le Havre",                coords: [ 0.1077,  49.4938], zoom: 9  },
  { name: "Amiens",                  coords: [ 2.2957,  49.8941], zoom: 9  },
  { name: "Perpignan",               coords: [ 2.8948,  42.6986], zoom: 9  },
  { name: "Pau",                     coords: [-0.3700,  43.2951], zoom: 9  },
  { name: "Brest",                   coords: [-4.4860,  48.3904], zoom: 9  },
  { name: "Quimper",                 coords: [-4.0977,  47.9969], zoom: 10 },
  { name: "Lorient",                 coords: [-3.3647,  47.7480], zoom: 10 },
  { name: "Vannes",                  coords: [-2.7599,  47.6553], zoom: 10 },
  { name: "Saint-Malo",              coords: [-1.9994,  48.6495], zoom: 10 },
  { name: "Dinard",                  coords: [-2.0614,  48.6317], zoom: 11 },
  { name: "Biarritz",                coords: [-1.5601,  43.4832], zoom: 10 },
  { name: "Bayonne",                 coords: [-1.4736,  43.4929], zoom: 10 },
  { name: "Saint-Jean-de-Luz",       coords: [-1.6617,  43.3884], zoom: 11 },
  { name: "La Rochelle",             coords: [-1.1520,  46.1603], zoom: 10 },
  { name: "Caen",                    coords: [-0.3704,  49.1829], zoom: 10 },
  { name: "Cherbourg-en-Cotentin",   coords: [-1.6328,  49.6337], zoom: 10 },
  { name: "Avignon",                 coords: [ 4.8055,  43.9493], zoom: 10 },
  { name: "Aix-en-Provence",         coords: [ 5.4474,  43.5297], zoom: 10 },
  { name: "Arles",                   coords: [ 4.6274,  43.6767], zoom: 10 },
  { name: "Saintes-Maries-de-la-Mer",coords: [ 4.4281,  43.4528], zoom: 11 },
  { name: "Colmar",                  coords: [ 7.3588,  48.0794], zoom: 10 },
  { name: "Sarlat-la-Canéda",        coords: [ 1.2190,  44.8898], zoom: 11 },
  { name: "Périgueux",               coords: [ 0.7218,  45.1854], zoom: 10 },
  { name: "Aubenas",                 coords: [ 4.3881,  44.6184], zoom: 10 },
  { name: "Lons-le-Saunier",         coords: [ 5.5535,  46.6742], zoom: 10 },
  { name: "Annecy",                  coords: [ 6.1297,  45.8992], zoom: 10 },
  { name: "Chamonix",                coords: [ 6.8696,  45.9237], zoom: 11 },
  { name: "Ajaccio",                 coords: [ 8.7369,  41.9192], zoom: 10 },
  { name: "Bastia",                  coords: [ 9.4522,  42.7027], zoom: 10 },
  { name: "Honfleur",                coords: [ 0.2330,  49.4188], zoom: 11 },
  { name: "Étretat",                 coords: [ 0.2022,  49.7068], zoom: 11 },
  { name: "Carcassonne",             coords: [ 2.3536,  43.2130], zoom: 10 },
  { name: "Lourdes",                 coords: [-0.0460,  43.0933], zoom: 10 },
];

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export default function SearchBar({ articles, onSelect, onClear }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Suggestions from existing articles (one per region)
  const regionSuggestions = useMemo<SearchSuggestion[]>(() => {
    const seen = new Set<string>();
    const result: SearchSuggestion[] = [];
    for (const a of articles) {
      if (seen.has(a.regionSlug)) continue;
      seen.add(a.regionSlug);
      const coords = REGION_CENTROIDS[a.regionSlug];
      if (!coords) continue;
      const count = articles.filter(x => x.regionSlug === a.regionSlug).length;
      result.push({
        id: `region-${a.regionSlug}`,
        label: a.regionName,
        sublabel: `${count} itinéraire${count > 1 ? "s" : ""} disponible${count > 1 ? "s" : ""}`,
        coords,
        zoom: 7,
        type: "region",
        regionSlug: a.regionSlug,
      });
    }
    return result;
  }, [articles]);

  // Filtered results based on current query
  const { matchedRegions, matchedCities } = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) {
      return { matchedRegions: regionSuggestions, matchedCities: [] };
    }
    return {
      matchedRegions: regionSuggestions.filter(s => normalize(s.label).includes(q)),
      matchedCities: FRENCH_CITIES
        .filter(c => normalize(c.name).includes(q))
        .slice(0, 6)
        .map(c => ({
          id: `city-${c.name}`,
          label: c.name,
          sublabel: "Zoom sur la carte",
          coords: c.coords,
          zoom: c.zoom,
          type: "city" as const,
        })),
    };
  }, [query, regionSuggestions]);

  const allSuggestions = useMemo(
    () => [...matchedRegions, ...matchedCities],
    [matchedRegions, matchedCities]
  );

  const showDropdown = open && allSuggestions.length > 0;

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const handleSelect = useCallback(
    (s: SearchSuggestion) => {
      setQuery(s.label);
      setOpen(false);
      setActiveIdx(-1);
      onSelect(s);
    },
    [onSelect]
  );

  const handleClear = useCallback(() => {
    setQuery("");
    setOpen(false);
    setActiveIdx(-1);
    onClear();
    inputRef.current?.focus();
  }, [onClear]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) { setOpen(true); setActiveIdx(0); return; }
      setActiveIdx(i => Math.min(i + 1, allSuggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0 && allSuggestions[activeIdx]) {
      e.preventDefault();
      handleSelect(allSuggestions[activeIdx]);
    } else if (e.key === "Escape") {
      setOpen(false);
      setActiveIdx(-1);
    }
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      {/* Input */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        <input
          ref={inputRef}
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); setActiveIdx(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Région, ville, département... (ex : Camargue, Bordeaux)"
          className="w-full pl-11 pr-10 py-4 rounded-2xl border border-slate-200 bg-white shadow-md text-slate-800 placeholder-slate-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
        {query && (
          <button
            onClick={handleClear}
            aria-label="Effacer"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden max-h-80 overflow-y-auto">
          {/* Itinéraires disponibles */}
          {matchedRegions.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Itinéraires disponibles
              </p>
              {matchedRegions.map((s, i) => (
                <SuggestionRow
                  key={s.id}
                  suggestion={s}
                  active={i === activeIdx}
                  icon="📍"
                  iconBg="bg-blue-50 text-blue-600"
                  onSelect={handleSelect}
                />
              ))}
            </div>
          )}

          {/* Villes & zones */}
          {matchedCities.length > 0 && (
            <div className={matchedRegions.length > 0 ? "border-t border-slate-100" : ""}>
              <p className="px-4 pt-3 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Villes & zones géographiques
              </p>
              {matchedCities.map((s, i) => (
                <SuggestionRow
                  key={s.id}
                  suggestion={s}
                  active={matchedRegions.length + i === activeIdx}
                  icon="🏙️"
                  iconBg="bg-slate-100 text-slate-500"
                  onSelect={handleSelect}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SuggestionRow({
  suggestion,
  active,
  icon,
  iconBg,
  onSelect,
}: {
  suggestion: SearchSuggestion;
  active: boolean;
  icon: string;
  iconBg: string;
  onSelect: (s: SearchSuggestion) => void;
}) {
  return (
    <button
      onClick={() => onSelect(suggestion)}
      className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
        active ? "bg-blue-50" : "hover:bg-slate-50"
      }`}
    >
      <span
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${iconBg}`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{suggestion.label}</p>
        {suggestion.sublabel && (
          <p className={`text-xs truncate ${suggestion.type === "region" ? "text-blue-500" : "text-slate-400"}`}>
            {suggestion.sublabel}
          </p>
        )}
      </div>
    </button>
  );
}
