/**
 * Sync dynamique : recalcule les totaux Yoni & Xalbat
 * depuis la table "Dépenses 💳" → met à jour la table "Finances"
 *
 * Logique :
 *   - "Petites Catégories" contient "1er van" → Yoni
 *   - "Petites Catégories" contient "2ème van" → Xalbat
 *   - Si les deux → compté dans les deux totaux
 *
 * Usage : npx tsx scripts/sync-airtable-vans.ts
 */

const AIRTABLE_TOKEN = process.env.AIRTABLE_API_KEY!;
const BASE_ID = "app2FIBm3EPBmi9bL";
const DEPENSES_TABLE = "tbliPuzbXN0s9QCX2";
const FINANCES_TABLE = "tblHD44V5TfUnEerY";

const YONI_RECORD_ID = "recWNPAfbTq05n3sx";
const XALBAT_RECORD_ID = "recZmdFXqm4THPG4R";

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

async function airtableFetch(
  path: string,
  options?: RequestInit
): Promise<unknown> {
  const res = await fetch(`https://api.airtable.com/v0/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${AIRTABLE_TOKEN}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Airtable ${res.status}: ${body}`);
  }
  return res.json();
}

async function getAllRecords(tableId: string): Promise<AirtableRecord[]> {
  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const params = new URLSearchParams({ pageSize: "100" });
    if (offset) params.set("offset", offset);

    const data = (await airtableFetch(
      `${BASE_ID}/${tableId}?${params}`
    )) as { records: AirtableRecord[]; offset?: string };

    records.push(...data.records);
    offset = data.offset;
  } while (offset);

  return records;
}

async function main() {
  console.log("📊 Sync Airtable Vans — début");

  // 1. Lire toutes les dépenses
  const depenses = await getAllRecords(DEPENSES_TABLE);
  console.log(`  ${depenses.length} dépenses trouvées`);

  // 2. Calculer les totaux via "Petites Catégories"
  let totalYoni = 0;
  let countYoni = 0;
  let totalXalbat = 0;
  let countXalbat = 0;

  for (const r of depenses) {
    const petitesCats = (r.fields["Petites Catégories"] as string[]) || [];
    const ttc = (r.fields["T.T.C"] as number) || 0;

    const is1erVan = petitesCats.includes("1er van");
    const is2emeVan = petitesCats.includes("2ème van");

    if (is1erVan) {
      totalYoni += ttc;
      countYoni++;
    }
    if (is2emeVan) {
      totalXalbat += ttc;
      countXalbat++;
    }
  }

  totalYoni = Math.round(totalYoni * 100) / 100;
  totalXalbat = Math.round(totalXalbat * 100) / 100;

  console.log(`  Yoni: ${countYoni} dépenses = ${totalYoni} €`);
  console.log(`  Xalbat: ${countXalbat} dépenses = ${totalXalbat} €`);

  // 3. Mettre à jour les lignes Finances
  const now = new Date().toISOString().slice(0, 10);

  await airtableFetch(`${BASE_ID}/${FINANCES_TABLE}`, {
    method: "PATCH",
    body: JSON.stringify({
      records: [
        {
          id: YONI_RECORD_ID,
          fields: {
            Description: "Total dépenses Van Yoni",
            Montant: -totalYoni,
            Date: now,
            Van: "Yoni",
            Type: "Sortie",
            Notes: `${countYoni} dépenses (tag "1er van")\nTotal: ${totalYoni.toFixed(2)} €\nDernière sync: ${now}`,
          },
        },
        {
          id: XALBAT_RECORD_ID,
          fields: {
            Description: "Total dépenses Van Xalbat",
            Montant: -totalXalbat,
            Date: now,
            Van: "Xalbat",
            Type: "Sortie",
            Notes: `${countXalbat} dépenses (tag "2ème van")\nTotal: ${totalXalbat.toFixed(2)} €\nDernière sync: ${now}`,
          },
        },
      ],
    }),
  });

  console.log(`  ✅ Finances mis à jour (${now})`);
  console.log(
    `  Total vans: ${(totalYoni + totalXalbat).toFixed(2)} €`
  );
}

main().catch(console.error);
