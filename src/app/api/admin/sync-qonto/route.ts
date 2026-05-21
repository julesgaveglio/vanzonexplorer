import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

// ── Config ──────────────────────────────────────────────────────────────────

const QONTO_SLUG = "vanzone-explorer-5424";
const QONTO_SECRET = process.env.QONTO_API_SECRET!;
const QONTO_BANK_ACCOUNT = "vanzone-explorer-5424-bank-account-1";

const AIRTABLE_TOKEN = process.env.AIRTABLE_API_KEY!;
const AIRTABLE_BASE = "app2FIBm3EPBmi9bL";
const AIRTABLE_FINANCES = "tblHD44V5TfUnEerY";   // Table "Finances"
const AIRTABLE_DEPENSES = "tbliPuzbXN0s9QCX2";   // Table "Dépenses 💳"

const GROQ_KEYS = [
  process.env.GROQ_API_KEY!,
  process.env.GROQ_API_KEY_2!,
  process.env.GROQ_API_KEY_3!,
].filter(Boolean);

// ── Types ───────────────────────────────────────────────────────────────────

interface QontoTransaction {
  id: string;
  transaction_id?: string;
  amount: number;
  side: "credit" | "debit";
  operation_type: string;
  label: string;
  clean_counterparty_name?: string;
  settled_at?: string;
  emitted_at?: string;
  status: string;
  category?: string;
  card_last_digits?: string;
  vat_amount?: number;
  vat_rate?: number;
  settled_balance?: number;
  cashflow_category?: { name: string };
  cashflow_subcategory?: { name: string };
}

interface GroqClassification {
  category: string;
  entity: "vanzon" | "yoni" | "xalbat" | "vba" | "perso";
  frequency_type: "subscription" | "recurring_expense" | "one_time_expense" | "recurring_income" | "one_time_income";
  confidence: number;
}

// ── Qonto API ───────────────────────────────────────────────────────────────

async function qontoFetch(path: string) {
  const res = await fetch(`https://thirdparty.qonto.com/v2${path}`, {
    headers: { Authorization: `${QONTO_SLUG}:${QONTO_SECRET}` },
  });
  if (!res.ok) throw new Error(`Qonto ${res.status}: ${await res.text()}`);
  return res.json();
}

// ── Airtable API ────────────────────────────────────────────────────────────

async function airtableFetch(path: string, options?: RequestInit) {
  const res = await fetch(`https://api.airtable.com/v0/${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${AIRTABLE_TOKEN}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`Airtable ${res.status}: ${await res.text()}`);
  return res.json();
}

async function getExistingAirtableIds(): Promise<Set<string>> {
  // Extract Qonto IDs from the Notes field of Finances table (format: "...Qonto ID: xxx...")
  const ids = new Set<string>();
  let offset: string | undefined;
  do {
    const params = new URLSearchParams({ pageSize: "100", "fields[]": "Notes" });
    if (offset) params.set("offset", offset);
    const data = await airtableFetch(`${AIRTABLE_BASE}/${AIRTABLE_FINANCES}?${params}`);
    for (const r of data.records) {
      const notes = (r.fields["Notes"] as string) || "";
      const match = notes.match(/Qonto ID\s*:\s*(\S+)/);
      if (match) ids.add(match[1]);
    }
    offset = data.offset;
  } while (offset);
  return ids;
}

// ── Supabase dedup ──────────────────────────────────────────────────────────

async function getExistingSupabaseIds(): Promise<Set<string>> {
  const sb = createSupabaseAdmin();
  const { data } = await sb
    .from("finance_transactions")
    .select("qonto_id")
    .not("qonto_id", "is", null);
  return new Set((data ?? []).map((r) => r.qonto_id));
}

// ── Groq AI Classification ─────────────────────────────────────────────────

const GROQ_PROMPT = `Tu es un assistant comptable pour Vanzon Explorer (location/achat/formation van amenage au Pays Basque).

Analyse cette transaction bancaire et retourne UNIQUEMENT un JSON valide, sans texte avant ni apres.

Categories depenses : Marketing, Meta Ads, Outils & SaaS, Amenagement Van, Electricite Van, Isolation Van, Accessoires Van, Entretien Van, Assurance, Carburant, Domaine & Hebergement, Agents IA, Juridique, Divers
Categories revenus : Location Van, Vente VBA, Consulting IA, Affiliation, Autre Revenu

Entites : vanzon (activite generale), yoni (van Yoni), xalbat (van Xalbat), vba (formation), perso (personnel Jules)

Regles :
- Meta/Facebook/facebk = "Meta Ads" + entity "vba"
- Yescapa = "Location Van" + entity par defaut "vanzon"
- Wikicampers = "Location Van" + entity par defaut "vanzon"
- Vercel/Clerk/Supabase/Sanity/Resend = "Outils & SaaS" + entity "vanzon"
- Groq/OpenAI/Anthropic = "Agents IA" + entity "vanzon"
- Jules Gaveglio/apport = si credit "Autre Revenu", si debit "Divers" + entity "perso"
- Notaire/avocat = "Juridique" + entity "vanzon"
- GoCardless/frais bancaires = "Divers" + entity "vanzon"
- Assurance = "Assurance" + entity selon van si identifiable

frequency_type :
- subscription = paiement recurrent pour un service (SaaS, pub, abo)
- recurring_expense = depense recurrente mais pas un abo (comptable, entretien)
- one_time_expense = achat ponctuel
- recurring_income = revenu qui revient regulierement (loyers plateforme)
- one_time_income = revenu ponctuel (vente, consulting one-shot)

Retourne UNIQUEMENT :
{"category":"...","entity":"...","frequency_type":"...","confidence":0.0}`;

async function classifyWithGroq(t: QontoTransaction): Promise<GroqClassification> {
  const userMsg = `Counterparty: ${t.clean_counterparty_name || "N/A"}
Amount: ${t.amount} EUR
Side: ${t.side}
Label: ${t.label || "N/A"}
Qonto category: ${t.cashflow_category?.name || t.category || "N/A"}
Qonto subcategory: ${t.cashflow_subcategory?.name || "N/A"}
Operation type: ${t.operation_type}`;

  for (const key of GROQ_KEYS) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: GROQ_PROMPT },
            { role: "user", content: userMsg },
          ],
          temperature: 0.1,
          max_tokens: 150,
          response_format: { type: "json_object" },
        }),
      });

      if (!res.ok) {
        console.warn(`[sync-qonto] Groq key failed (${res.status}), trying next...`);
        continue;
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) continue;

      const parsed = JSON.parse(content) as GroqClassification;
      // Validate fields
      if (parsed.category && parsed.entity && parsed.frequency_type) {
        return parsed;
      }
    } catch (err) {
      console.warn(`[sync-qonto] Groq error:`, err);
      continue;
    }
  }

  // Fallback: keyword-based classification
  return fallbackClassify(t);
}

// ── Fallback keyword classification ─────────────────────────────────────────

function fallbackClassify(t: QontoTransaction): GroqClassification {
  const name = (t.clean_counterparty_name || t.label || "").toLowerCase();
  const isCredit = t.side === "credit";

  let category = "Divers";
  let entity: GroqClassification["entity"] = "vanzon";
  let frequency_type: GroqClassification["frequency_type"] = isCredit ? "one_time_income" : "one_time_expense";

  if (name.includes("facebk") || name.includes("meta")) {
    category = "Meta Ads"; entity = "vba"; frequency_type = "subscription";
  } else if (name.includes("yescapa") || name.includes("wikicampers")) {
    category = "Location Van"; frequency_type = "recurring_income";
  } else if (name.includes("vercel") || name.includes("clerk") || name.includes("supabase") || name.includes("sanity") || name.includes("resend")) {
    category = "Outils & SaaS"; frequency_type = "subscription";
  } else if (name.includes("groq") || name.includes("openai") || name.includes("anthropic")) {
    category = "Agents IA"; frequency_type = "subscription";
  } else if (name.includes("notaire") || name.includes("avocat")) {
    category = "Juridique"; frequency_type = "one_time_expense";
  } else if (name.includes("jules") || name.includes("gaveglio")) {
    category = isCredit ? "Autre Revenu" : "Divers"; entity = "perso";
  } else if (name.includes("assurance") || name.includes("maif") || name.includes("allianz")) {
    category = "Assurance"; frequency_type = "recurring_expense";
  } else if (t.operation_type === "qonto_fee" || name.includes("gocardless")) {
    category = "Divers"; frequency_type = "recurring_expense";
  }

  return { category, entity, frequency_type, confidence: 0.5 };
}

// ── Mapping helpers ─────────────────────────────────────────────────────────

const OP_MAP: Record<string, string> = {
  card: "Carte", transfer: "Virement", direct_debit: "Prélèvement",
  qonto_fee: "Qonto", income: "Virement",
};

const FREQ_LABELS: Record<string, string> = {
  subscription: "Abonnement",
  recurring_expense: "Dépense récurrente",
  one_time_expense: "One-shot",
  recurring_income: "Revenu récurrent",
  one_time_income: "Revenu ponctuel",
};

function buildNotes(t: QontoTransaction): string {
  const lines = [
    `Libellé : ${t.label}`,
    `Fournisseur : ${t.clean_counterparty_name || "N/A"}`,
    `Montant : ${t.amount.toFixed(2)} €`,
    `HT : ${(t.amount - (t.vat_amount || 0)).toFixed(2)} €`,
    `TVA : ${(t.vat_amount || 0).toFixed(2)} € (${(t.vat_rate || 0).toFixed(0)}%)`,
    `Date émission : ${(t.emitted_at || "N/A").slice(0, 19).replace("T", " ")}`,
    `Date règlement : ${(t.settled_at || "N/A").slice(0, 19).replace("T", " ")}`,
    `Type : ${t.side} (${t.operation_type})`,
  ];
  if (t.card_last_digits) lines.push(`Carte : *${t.card_last_digits}`);
  lines.push(`Statut : ${t.status}`);
  lines.push(`Catégorie Qonto : ${t.cashflow_category?.name || ""}`);
  if (t.cashflow_subcategory?.name) lines.push(`Sous-catégorie : ${t.cashflow_subcategory.name}`);
  lines.push(`Solde après : ${(t.settled_balance || 0).toFixed(2)} €`);
  lines.push(`Qonto ID : ${t.id}`);
  return lines.join("\n");
}

// ── Resolve Supabase category_id from name ──────────────────────────────────

let categoryCache: Map<string, { id: string; type: string }> | null = null;

async function getCategoryId(categoryName: string, type: "expense" | "income"): Promise<string | null> {
  if (!categoryCache) {
    const sb = createSupabaseAdmin();
    const { data } = await sb.from("finance_categories").select("id, name, type");
    categoryCache = new Map();
    for (const cat of data ?? []) {
      categoryCache.set(`${cat.name}|${cat.type}`, { id: cat.id, type: cat.type });
    }
  }

  // Try exact match with correct type first
  const exact = categoryCache.get(`${categoryName}|${type}`);
  if (exact) return exact.id;

  // Try case-insensitive match
  const entries = Array.from(categoryCache.entries());
  for (const [key, val] of entries) {
    if (key.toLowerCase().startsWith(categoryName.toLowerCase() + "|") && val.type === type) {
      return val.id;
    }
  }

  return null;
}

// ── Main sync ───────────────────────────────────────────────────────────────

async function syncQonto() {
  // 1. Fetch latest transactions from Qonto
  const qontoData = await qontoFetch(
    `/transactions?slug=${QONTO_BANK_ACCOUNT}&per_page=100&sort_by=settled_at:desc`
  );
  const transactions = qontoData.transactions as QontoTransaction[];

  // 2. Get existing IDs from both targets
  const [airtableIds, supabaseIds] = await Promise.all([
    getExistingAirtableIds(),
    getExistingSupabaseIds(),
  ]);

  // 3. Filter truly new transactions (not in either target)
  const newForAirtable = transactions.filter((t) => !airtableIds.has(t.id));
  const newForSupabase = transactions.filter((t) => !supabaseIds.has(t.id));
  const allNew = transactions.filter((t) => !airtableIds.has(t.id) || !supabaseIds.has(t.id));

  if (allNew.length === 0) {
    return { synced: 0, airtable: 0, supabase: 0, message: "Aucune nouvelle transaction" };
  }

  // 4. Classify all new transactions with Groq AI
  const uniqueIds = new Set(allNew.map((t) => t.id));
  const toClassify = transactions.filter((t) => uniqueIds.has(t.id));

  console.log(`[sync-qonto] Classifying ${toClassify.length} transactions with Groq AI...`);

  const classifications = new Map<string, GroqClassification>();
  for (const t of toClassify) {
    const cls = await classifyWithGroq(t);
    classifications.set(t.id, cls);
    console.log(`[sync-qonto] ${t.clean_counterparty_name || t.label} → ${cls.category} (${cls.entity}, ${cls.frequency_type}, conf: ${cls.confidence})`);
  }

  // 5. Write to Airtable (2 tables: Finances + Dépenses)
  let airtableCount = 0;
  if (newForAirtable.length > 0) {
    try {
      // Dépenses 💳 table (detailed, matches existing fields)
      const depRecords = newForAirtable.map((t) => {
        const cls = classifications.get(t.id)!;
        const isCredit = t.side === "credit";
        return {
          fields: {
            Produit: t.clean_counterparty_name || t.label,
            Description: `${t.label}\nQonto ID : ${t.id}\n${FREQ_LABELS[cls.frequency_type] || cls.frequency_type} | ${cls.entity} | Conf: ${cls.confidence}`,
            "H.T": Math.round((t.amount - (t.vat_amount || 0)) * 100) / 100,
            "T.V.A": t.vat_amount || 0,
            "T.T.C": t.amount,
            "Grosse Catégorie": cls.category,
            Date: t.settled_at?.slice(0, 10) || null,
            "Fréquence": FREQ_LABELS[cls.frequency_type] || cls.frequency_type,
            Van: cls.entity === "yoni" ? "Yoni" : cls.entity === "xalbat" ? "Xalbat" : undefined,
            "Payé par :": isCredit ? undefined : (t.operation_type === "card" ? "Carte Qonto" : "Virement"),
          },
        };
      });

      for (let i = 0; i < depRecords.length; i += 10) {
        const batch = depRecords.slice(i, i + 10);
        await airtableFetch(`${AIRTABLE_BASE}/${AIRTABLE_DEPENSES}`, {
          method: "POST",
          body: JSON.stringify({ records: batch }),
        });
      }

      // Finances table (simplified view)
      const finRecords = newForAirtable.map((t) => {
        const cls = classifications.get(t.id)!;
        const isCredit = t.side === "credit";
        return {
          fields: {
            Date: t.settled_at?.slice(0, 10) || null,
            Description: t.clean_counterparty_name || t.label,
            Montant: isCredit ? t.amount : -t.amount,
            "Catégorie": cls.category,
            "Sous-catégorie": t.cashflow_subcategory?.name || "",
            Type: isCredit ? "Entrée" : "Sortie",
            "Moyen de paiement": OP_MAP[t.operation_type] || "Autre",
            Van: cls.entity === "yoni" ? "Yoni" : cls.entity === "xalbat" ? "Xalbat" : undefined,
            Notes: `${FREQ_LABELS[cls.frequency_type]} | ${cls.entity} | Conf: ${cls.confidence} | TVA: ${(t.vat_amount || 0).toFixed(2)}€\nQonto ID : ${t.id}`,
          },
        };
      });

      for (let i = 0; i < finRecords.length; i += 10) {
        const batch = finRecords.slice(i, i + 10);
        await airtableFetch(`${AIRTABLE_BASE}/${AIRTABLE_FINANCES}`, {
          method: "POST",
          body: JSON.stringify({ records: batch }),
        });
      }

      airtableCount = newForAirtable.length;
    } catch (err) {
      console.error("[sync-qonto] Airtable write failed:", err);
      // Continue — we still write to Supabase
    }
  }

  // 6. Write to Supabase
  let supabaseCount = 0;
  if (newForSupabase.length > 0) {
    try {
      const sb = createSupabaseAdmin();

      for (const t of newForSupabase) {
        const cls = classifications.get(t.id)!;
        const isCredit = t.side === "credit";
        const type = isCredit ? "income" : "expense";
        const categoryId = await getCategoryId(cls.category, type);

        const { error } = await sb.from("finance_transactions").insert({
          date: t.settled_at?.slice(0, 10) || new Date().toISOString().split("T")[0],
          description: t.clean_counterparty_name || t.label,
          amount: Math.abs(t.amount),
          type,
          category_id: categoryId,
          entity: cls.entity,
          tags: [cls.frequency_type],
          notes: buildNotes(t),
          is_recurring: ["subscription", "recurring_expense", "recurring_income"].includes(cls.frequency_type),
          recurring_frequency: ["subscription", "recurring_expense", "recurring_income"].includes(cls.frequency_type) ? "monthly" : null,
          qonto_id: t.id,
          frequency_type: cls.frequency_type,
          counterparty: t.clean_counterparty_name || null,
          payment_method: OP_MAP[t.operation_type] || t.operation_type,
          vat_amount: t.vat_amount || 0,
          settled_balance: t.settled_balance || null,
        });

        if (error) {
          console.error(`[sync-qonto] Supabase insert failed for ${t.id}:`, error.message);
        } else {
          supabaseCount++;
        }
      }
    } catch (err) {
      console.error("[sync-qonto] Supabase write failed:", err);
    }
  }

  const msg = `${allNew.length} transactions traitées (Airtable: ${airtableCount}, Supabase: ${supabaseCount})`;
  console.log(`[sync-qonto] ${msg}`);

  return {
    synced: allNew.length,
    airtable: airtableCount,
    supabase: supabaseCount,
    message: msg,
  };
}

// ── GET: manual trigger from admin ──────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cronSecret = searchParams.get("secret");

  if (cronSecret !== process.env.CRON_SECRET && !request.headers.get("cookie")?.includes("__clerk")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncQonto();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[sync-qonto] Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// ── POST: Qonto webhook (real-time) — only syncs the ONE new transaction ────

export async function POST(request: Request) {
  try {
    // Qonto webhook payload contains the transaction_id
    const body = await request.json().catch(() => ({}));
    const transactionId = body?.object_id || body?.transaction_id;

    if (!transactionId) {
      // No specific transaction — do nothing (avoid full re-sync)
      console.log("[sync-qonto] Webhook received but no transaction_id — ignoring");
      return NextResponse.json({ message: "No transaction_id in payload" });
    }

    // Fetch this specific transaction from Qonto
    const qontoData = await qontoFetch(
      `/transactions?slug=${QONTO_BANK_ACCOUNT}&per_page=100&sort_by=settled_at:desc`
    );
    const allTxs = qontoData.transactions as QontoTransaction[];
    const tx = allTxs.find((t) => t.id === transactionId || t.transaction_id === transactionId);

    if (!tx) {
      console.log(`[sync-qonto] Transaction ${transactionId} not found in Qonto`);
      return NextResponse.json({ message: "Transaction not found" });
    }

    // Check if already exists in Supabase
    const sb = createSupabaseAdmin();
    const { data: existing } = await sb
      .from("finance_transactions")
      .select("id")
      .eq("qonto_id", tx.id)
      .maybeSingle();

    if (existing) {
      console.log(`[sync-qonto] Transaction ${tx.id} already in Supabase — skipping`);
      return NextResponse.json({ message: "Already synced" });
    }

    // Classify with Groq
    const cls = await classifyWithGroq(tx);
    console.log(`[sync-qonto] Webhook: ${tx.clean_counterparty_name || tx.label} → ${cls.category} (${cls.entity}, ${cls.frequency_type})`);

    // Write to Supabase
    const isCredit = tx.side === "credit";
    const type = isCredit ? "income" : "expense";
    const categoryId = await getCategoryId(cls.category, type);

    const { error: sbError } = await sb.from("finance_transactions").insert({
      date: tx.settled_at?.slice(0, 10) || new Date().toISOString().split("T")[0],
      description: tx.clean_counterparty_name || tx.label,
      amount: Math.abs(tx.amount),
      type,
      category_id: categoryId,
      entity: cls.entity,
      tags: [cls.frequency_type],
      notes: buildNotes(tx),
      is_recurring: ["subscription", "recurring_expense", "recurring_income"].includes(cls.frequency_type),
      recurring_frequency: ["subscription", "recurring_expense", "recurring_income"].includes(cls.frequency_type) ? "monthly" : null,
      qonto_id: tx.id,
      frequency_type: cls.frequency_type,
      counterparty: tx.clean_counterparty_name || null,
      payment_method: OP_MAP[tx.operation_type] || tx.operation_type,
      vat_amount: tx.vat_amount || 0,
      settled_balance: tx.settled_balance || null,
    });

    if (sbError) console.error(`[sync-qonto] Supabase error:`, sbError.message);

    // Map to Airtable categories
    const CAT_MAP_FIN: Record<string, string> = {
      "Meta Ads": "Marketing", "Outils & SaaS": "Marketing", "Agents IA": "Marketing",
      "Domaine & Hebergement": "Marketing", "Marketing": "Marketing",
      "Location Van": "Location van", "Vente VBA": "Van Business Academy",
      "Consulting IA": "Apport", "Affiliation": "Location van", "Autre Revenu": "Apport",
      "Assurance": "Frais bancaires", "Carburant": "Frais bancaires",
      "Juridique": "Juridique", "Divers": "Frais bancaires",
    };

    // Write to Airtable Finances only (Depenses is manual)
    try {
      await airtableFetch(`${AIRTABLE_BASE}/${AIRTABLE_FINANCES}`, {
        method: "POST",
        body: JSON.stringify({ records: [{
          fields: {
            Date: tx.settled_at?.slice(0, 10) || null,
            Description: tx.clean_counterparty_name || tx.label,
            Montant: isCredit ? tx.amount : -tx.amount,
            "Catégorie": CAT_MAP_FIN[cls.category] || "Frais bancaires",
            "Sous-catégorie": tx.cashflow_subcategory?.name || "",
            Type: isCredit ? "Entrée" : "Sortie",
            "Moyen de paiement": OP_MAP[tx.operation_type] || "Autre",
            Notes: `${FREQ_LABELS[cls.frequency_type]} | ${cls.entity} | Conf: ${cls.confidence}\nQonto ID : ${tx.id}`,
          },
        }] }),
      });
    } catch (err) {
      console.error("[sync-qonto] Airtable write failed:", err);
    }

    return NextResponse.json({
      synced: 1,
      transaction: tx.clean_counterparty_name || tx.label,
      category: cls.category,
      entity: cls.entity,
      frequency: cls.frequency_type,
    });
  } catch (error) {
    console.error("[sync-qonto] Webhook error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
