/**
 * region-normalizer.ts
 * Normalise un texte de région libre en slug standardisé.
 * Utilisé par road-trip-publisher-agent.ts
 */

const REGION_MAP: Record<string, string> = {
  // Pays Basque
  "pays basque": "pays-basque",
  "pays-basque": "pays-basque",
  "basque": "pays-basque",
  "biarritz": "pays-basque",
  "bayonne": "pays-basque",
  "saint jean de luz": "pays-basque",
  // Bretagne
  "bretagne": "bretagne",
  "finistere": "bretagne",
  "morbihan": "bretagne",
  "cotes d'armor": "bretagne",
  "ille et vilaine": "bretagne",
  "brest": "bretagne",
  "quimper": "bretagne",
  "rennes": "bretagne",
  // Provence
  "provence": "provence",
  "var": "provence",
  "bouches du rhone": "provence",
  "paca": "provence",
  "marseille": "provence",
  "aix en provence": "provence",
  "toulon": "provence",
  // Camargue
  "camargue": "camargue",
  "arles": "camargue",
  "saintes maries de la mer": "camargue",
  // Alsace
  "alsace": "alsace",
  "bas rhin": "alsace",
  "haut rhin": "alsace",
  "strasbourg": "alsace",
  "colmar": "alsace",
  // Dordogne
  "dordogne": "dordogne",
  "perigord": "dordogne",
  "sarlat": "dordogne",
  "bergerac": "dordogne",
  // Corse
  "corse": "corse",
  "haute corse": "corse",
  "corse du sud": "corse",
  "ajaccio": "corse",
  "bastia": "corse",
  // Normandie
  "normandie": "normandie",
  "calvados": "normandie",
  "eure": "normandie",
  "seine maritime": "normandie",
  "caen": "normandie",
  "rouen": "normandie",
  // Ardèche
  "ardeche": "ardeche",
  "ardèche": "ardeche",
  "gorges de l'ardeche": "ardeche",
  // Pyrénées
  "pyrenees": "pyrenees",
  "pyrénées": "pyrenees",
  "hautes pyrenees": "pyrenees",
  "pyrenees atlantiques": "pyrenees",
  "ariege": "pyrenees",
  "lourdes": "pyrenees",
  // Loire
  "loire": "loire",
  "val de loire": "loire",
  "indre et loire": "loire",
  "maine et loire": "loire",
  "tours": "loire",
  "amboise": "loire",
  // Jura
  "jura": "jura",
  "franche comte": "jura",
  "lons le saunier": "jura",
  // Vercors
  "vercors": "vercors",
  "isere": "vercors",
  "drome": "vercors",
  "grenoble": "vercors",
  // Cotentin
  "cotentin": "cotentin",
  "manche": "cotentin",
  "cherbourg": "cotentin",
  "mont saint michel": "cotentin",
  // Landes
  "landes": "landes",
  "hossegor": "landes",
  "capbreton": "landes",
  "mont de marsan": "landes",
};

/**
 * Normalise un texte de région en slug.
 * Essaie d'abord un matching exact, puis substring, puis Nominatim.
 */
export function normalizeRegion(region: string): string {
  const normalized = region
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s-]/g, "")
    .trim();

  // Exact match
  if (REGION_MAP[normalized]) return REGION_MAP[normalized];

  // Substring match
  for (const [key, slug] of Object.entries(REGION_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return slug;
    }
  }

  // Fallback : slugify the normalized string
  const slug = normalized.replace(/\s+/g, "-");
  console.warn(`[region-normalizer] Region inconnue: "${region}" → fallback slug: "${slug}"`);
  return slug;
}

/**
 * Récupère le nom officiel d'une région depuis son slug.
 */
export function getRegionName(slug: string): string {
  const names: Record<string, string> = {
    "pays-basque": "Pays Basque",
    "bretagne": "Bretagne",
    "provence": "Provence",
    "camargue": "Camargue",
    "alsace": "Alsace",
    "dordogne": "Dordogne",
    "corse": "Corse",
    "normandie": "Normandie",
    "ardeche": "Ardèche",
    "pyrenees": "Pyrénées",
    "loire": "Val de Loire",
    "jura": "Jura",
    "vercors": "Vercors",
    "cotentin": "Cotentin",
    "landes": "Landes",
  };
  return names[slug] || slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}
