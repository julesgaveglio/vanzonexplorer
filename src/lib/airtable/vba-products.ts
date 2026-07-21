import "server-only";

/**
 * Lecture directe des produits (matériel + outils) liés aux vidéos VBA depuis
 * l'Airtable « LISTE DE COURSE PERSO » (base appcWJkwjktMGM2HN).
 *
 * Airtable est le panneau de contrôle : Jules tague chaque produit à une ou
 * plusieurs vidéos via le champ multi-sélection « 🎬 Vidéo VBA » (options du
 * type « M4 · <titre de la leçon> »). On lit les 3 tables entières, mises en
 * cache ~60 s (Next Data Cache) — un seul appel par table sert toutes les
 * leçons. Filtrage par vidéo côté serveur.
 */

const BASE_ID = "appcWJkwjktMGM2HN";
const API = "https://api.airtable.com/v0";
const REVALIDATE_SECONDS = 60;

// Field IDs (stables même si Jules renomme les colonnes) par table.
const TABLES = {
  matosVasp: {
    id: "tblhLd2KXtlbP3FA5",
    produit: "fld1Ptzif5h5w5CfX",
    prix: "fldwcdWiVZ8wCIMg4",
    description: "fldE34SBhp5l8Lo2I",
    lien: "fld3vP90qRK09M0Uk",
    photo: "fldEsR02DeOoJX2jb",
    video: "fldItpHpCKn7HUIJH",
  },
  matosNonVasp: {
    id: "tblhz68D1fh7MWzi3",
    produit: "fld1DmFbjRd1tYwXV",
    prix: "fldw062bZL4szBGY2",
    description: "fldERXYulb1h5EiKG",
    lien: "fld3jIfTuDGW6FUCi",
    photo: "fldEgK6VH0KkGQW19",
    video: "fldXdx6M3VN8Nwskm",
  },
  outils: {
    id: "tblKFm00NzdivppxW",
    produit: "flduJCxy5b9ccrmcO",
    prix: "fldZ6mUyL50Di4wdV",
    description: "fld7XdQR7vXsO78Zz",
    lien: "fldwpY7ggXC7P8KRb",
    photo: "fld7m0YitkGvpjMg2",
    video: "fldrltZalaN3Fk35m",
  },
} as const;

type TableCfg = (typeof TABLES)[keyof typeof TABLES];

export interface VBAProduct {
  id: string;
  name: string;
  price: number | null;
  description: string | null;
  url: string | null;
  image: string | null;
}

export interface VBALessonProducts {
  materials: VBAProduct[];
  tools: VBAProduct[];
}

interface AirtableAttachment {
  url?: string;
  thumbnails?: { large?: { url: string }; small?: { url: string } };
}

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

/**
 * Construit le nom d'option Airtable pour une leçon donnée.
 * Doit correspondre exactement aux options créées (« M{n} · {titre} »).
 * Le numéro de module suit la logique de la sidebar (non-VASP = order − 20).
 */
export function lessonVideoTag(
  moduleOrder: number,
  moduleSection: string | undefined,
  lessonTitle: string
): string {
  const n = moduleSection === "non_vasp" ? moduleOrder - 20 : moduleOrder;
  return `M${n} · ${lessonTitle}`;
}

async function fetchTable(cfg: TableCfg): Promise<AirtableRecord[]> {
  const key = process.env.AIRTABLE_API_KEY;
  if (!key) return [];

  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams({
      pageSize: "100",
      returnFieldsByFieldId: "true",
    });
    for (const fid of [cfg.produit, cfg.prix, cfg.description, cfg.lien, cfg.photo, cfg.video]) {
      params.append("fields[]", fid);
    }
    if (offset) params.set("offset", offset);

    let res: Response;
    try {
      res = await fetch(`${API}/${BASE_ID}/${cfg.id}?${params}`, {
        headers: { Authorization: `Bearer ${key}` },
        next: { revalidate: REVALIDATE_SECONDS },
      });
    } catch {
      return records; // réseau KO : on renvoie ce qu'on a, la section se masque
    }
    if (!res.ok) return records;

    const data = (await res.json()) as { records?: AirtableRecord[]; offset?: string };
    records.push(...(data.records ?? []));
    offset = data.offset;
  } while (offset);

  return records;
}

function bestImage(field: unknown): string | null {
  if (!Array.isArray(field) || field.length === 0) return null;
  const att = field[0] as AirtableAttachment;
  return att.thumbnails?.large?.url ?? att.url ?? att.thumbnails?.small?.url ?? null;
}

function mapRecord(rec: AirtableRecord, cfg: TableCfg): VBAProduct {
  const f = rec.fields;
  const name = typeof f[cfg.produit] === "string" ? (f[cfg.produit] as string) : "";
  const price = typeof f[cfg.prix] === "number" ? (f[cfg.prix] as number) : null;
  const description =
    typeof f[cfg.description] === "string" ? (f[cfg.description] as string) : null;
  const url = typeof f[cfg.lien] === "string" ? (f[cfg.lien] as string).trim() : null;
  return { id: rec.id, name, price, description, url: url || null, image: bestImage(f[cfg.photo]) };
}

function taggedFor(rec: AirtableRecord, cfg: TableCfg, tag: string): boolean {
  const v = rec.fields[cfg.video];
  if (!Array.isArray(v)) return false;
  return (v as string[]).some((opt) => opt === tag);
}

/**
 * Renvoie les produits (matériel + outils) tagués pour une vidéo donnée.
 * `videoTag` = résultat de lessonVideoTag(). Matériel = union des deux tables
 * Matos ; Outils = table Outils.
 */
export async function getLessonProducts(videoTag: string): Promise<VBALessonProducts> {
  const [vasp, nonVasp, outils] = await Promise.all([
    fetchTable(TABLES.matosVasp),
    fetchTable(TABLES.matosNonVasp),
    fetchTable(TABLES.outils),
  ]);

  const materials: VBAProduct[] = [
    ...vasp.filter((r) => taggedFor(r, TABLES.matosVasp, videoTag)).map((r) => mapRecord(r, TABLES.matosVasp)),
    ...nonVasp
      .filter((r) => taggedFor(r, TABLES.matosNonVasp, videoTag))
      .map((r) => mapRecord(r, TABLES.matosNonVasp)),
  ].filter((p) => p.name);

  const tools: VBAProduct[] = outils
    .filter((r) => taggedFor(r, TABLES.outils, videoTag))
    .map((r) => mapRecord(r, TABLES.outils))
    .filter((p) => p.name);

  return { materials, tools };
}
