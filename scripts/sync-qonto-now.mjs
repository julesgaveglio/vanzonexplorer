import "dotenv/config";

const QONTO_SLUG = "vanzone-explorer-5424";
const QONTO_SECRET = process.env.QONTO_API_SECRET;
const QONTO_BANK_ACCOUNT = "vanzone-explorer-5424-bank-account-1";
const AIRTABLE_TOKEN = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE = "app2FIBm3EPBmi9bL";
const AIRTABLE_FINANCES = "tblHD44V5TfUnEerY";
const AIRTABLE_DEPENSES = "tbliPuzbXN0s9QCX2";
const GROQ_KEY = process.env.GROQ_API_KEY;

const OP_MAP = { card: "Carte", transfer: "Virement", direct_debit: "Prélèvement", qonto_fee: "Qonto", income: "Virement" };
const STATUS_MAP = { completed: "Complété", pending: "En cours", declined: "Annulé", reversed: "Annulé" };
const FREQ_LABELS = { subscription: "Abonnement", recurring_expense: "Dépense récurrente", one_time_expense: "One-shot", recurring_income: "Revenu récurrent", one_time_income: "Revenu ponctuel" };

// Map Groq categories to existing Airtable select options
const CAT_MAP_FINANCES = {
  "Meta Ads": "Marketing", "Outils & SaaS": "Marketing", "Agents IA": "Marketing",
  "Domaine & Hebergement": "Marketing", "Marketing": "Marketing",
  "Location Van": "Location van", "Vente VBA": "Van Business Academy",
  "Consulting IA": "Apport", "Affiliation": "Location van", "Autre Revenu": "Apport",
  "Amenagement Van": "YONI", "Entretien Van": "YONI", "Accessoires Van": "YONI",
  "Electricite Van": "YONI", "Isolation Van": "YONI",
  "Assurance": "Frais bancaires", "Carburant": "Frais bancaires",
  "Juridique": "Juridique", "Divers": "Frais bancaires",
};
const CAT_MAP_DEPENSES = {
  "Meta Ads": "Marketing", "Marketing": "Marketing", "Outils & SaaS": "Marketing",
  "Agents IA": "Marketing", "Domaine & Hebergement": "Marketing",
  "Amenagement Van": "Travaux", "Electricite Van": "Travaux", "Isolation Van": "Travaux",
  "Accessoires Van": "Matos", "Entretien Van": "Maintenance",
  "Assurance": "Assurance", "Carburant": "Véhicule",
  "Juridique": "Lancement Vanzon", "Divers": "Divers",
  "Location Van": "Divers", "Vente VBA": "Formation", "Consulting IA": "Divers",
  "Affiliation": "Divers", "Autre Revenu": "Divers",
};
const FREQ_MAP_DEPENSES = { "Abonnement": "One Shot", "Dépense récurrente": "One Shot", "One-shot": "One Shot", "Revenu récurrent": "One Shot", "Revenu ponctuel": "One Shot" };

const PROMPT = `Tu es un assistant comptable pour Vanzon Explorer (location/achat/formation van amenage).
Analyse cette transaction et retourne UNIQUEMENT un JSON:
Categories depenses: Marketing, Meta Ads, Outils & SaaS, Amenagement Van, Assurance, Carburant, Domaine & Hebergement, Agents IA, Juridique, Divers
Categories revenus: Location Van, Vente VBA, Consulting IA, Affiliation, Autre Revenu
Entites: vanzon, yoni, xalbat, vba, perso
Regles: Meta/Facebook="Meta Ads"+vba, Yescapa/Wikicampers="Location Van"+vanzon, Vercel/Clerk/Supabase="Outils & SaaS"+vanzon
frequency_type: subscription, recurring_expense, one_time_expense, recurring_income, one_time_income
Retourne: {"category":"...","entity":"...","frequency_type":"...","confidence":0.0}`;

// 1. Fetch Qonto
const qRes = await fetch(`https://thirdparty.qonto.com/v2/transactions?slug=${QONTO_BANK_ACCOUNT}&per_page=100&sort_by=settled_at:desc`, {
  headers: { Authorization: `${QONTO_SLUG}:${QONTO_SECRET}` },
});
const qData = await qRes.json();
const txs = qData.transactions;
console.log(`Qonto: ${txs.length} transactions fetched`);

// 2. Get existing Airtable IDs
const existingIds = new Set();
let offset;
do {
  const params = new URLSearchParams({ pageSize: "100", "fields[]": "Notes" });
  if (offset) params.set("offset", offset);
  const res = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_FINANCES}?${params}`, {
    headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
  });
  const data = await res.json();
  if (!data.records) { console.log("Airtable response:", JSON.stringify(data).slice(0,200)); break; }
  for (const r of data.records) {
    const notes = r.fields?.Notes || "";
    const match = notes.match(/Qonto ID\s*:\s*(\S+)/);
    if (match) existingIds.add(match[1]);
  }
  offset = data.offset;
} while (offset);
console.log(`Airtable: ${existingIds.size} existing transactions`);

// 3. Filter new
const newTxs = txs.filter(t => !existingIds.has(t.id));
console.log(`New transactions to sync: ${newTxs.length}`);

if (newTxs.length === 0) { console.log("Nothing to sync!"); process.exit(0); }

// 4. Classify and write each
let synced = 0;
for (const t of newTxs) {
  let cls = { category: "Divers", entity: "vanzon", frequency_type: "one_time_expense", confidence: 0.5 };
  try {
    const gRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: PROMPT },
          { role: "user", content: `Counterparty: ${t.clean_counterparty_name || "N/A"}\nAmount: ${t.amount} EUR\nSide: ${t.side}\nLabel: ${t.label}\nCategory: ${t.cashflow_category?.name || ""}` },
        ],
        temperature: 0.1, max_tokens: 150, response_format: { type: "json_object" },
      }),
    });
    const gData = await gRes.json();
    cls = JSON.parse(gData.choices[0].message.content);
  } catch (e) { console.log(`  Groq fallback for ${t.clean_counterparty_name}`); }

  const isCredit = t.side === "credit";

  // DEPENSES table
  const r1 = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_DEPENSES}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ records: [{
      fields: {
        Produit: t.clean_counterparty_name || t.label,
        Description: `${t.label}\nQonto ID : ${t.id}\nAI: ${cls.category} | ${cls.entity} | ${FREQ_LABELS[cls.frequency_type] || cls.frequency_type} | Conf: ${cls.confidence}`,
        "H.T": Math.round((t.amount - (t.vat_amount || 0)) * 100) / 100,
        "T.V.A": t.vat_amount || 0,
        "T.T.C": t.amount,
        "Grosse Catégorie": CAT_MAP_DEPENSES[cls.category] || "Divers",
        Date: t.settled_at?.slice(0, 10),
        "Fréquence": FREQ_MAP_DEPENSES[FREQ_LABELS[cls.frequency_type]] || "One Shot",
      },
    }] }),
  });

  // FINANCES table
  const r2 = await fetch(`https://api.airtable.com/v0/${AIRTABLE_BASE}/${AIRTABLE_FINANCES}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ records: [{
      fields: {
        Date: t.settled_at?.slice(0, 10),
        Description: t.clean_counterparty_name || t.label,
        Montant: isCredit ? t.amount : -t.amount,
        "Catégorie": CAT_MAP_FINANCES[cls.category] || "Frais bancaires",
        "Sous-catégorie": t.cashflow_subcategory?.name || "",
        Type: isCredit ? "Entrée" : "Sortie",
        "Moyen de paiement": OP_MAP[t.operation_type] || "Autre",
        Notes: `${FREQ_LABELS[cls.frequency_type] || cls.frequency_type} | ${cls.entity} | Conf: ${cls.confidence}\nQonto ID : ${t.id}`,
      },
    }] }),
  });

  const ok1 = r1.ok ? "✓" : "✗";
  const ok2 = r2.ok ? "✓" : "✗";
  if (!r1.ok) { const err = await r1.text(); console.log(`  DEP error: ${err.slice(0,150)}`); }
  if (!r2.ok) { const err = await r2.text(); console.log(`  FIN error: ${err.slice(0,150)}`); }
  synced++;
  console.log(`  ${t.settled_at?.slice(0,10)} | ${t.amount}€ | ${(t.clean_counterparty_name || t.label).padEnd(20)} → ${cls.category} (${cls.entity}, ${FREQ_LABELS[cls.frequency_type] || cls.frequency_type}) | DEP:${ok1} FIN:${ok2}`);
}

console.log(`\nDone! ${synced} transactions synced to Airtable with AI classification.`);
