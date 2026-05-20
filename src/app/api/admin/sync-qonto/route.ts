import { NextResponse } from "next/server";

const QONTO_SLUG = "vanzone-explorer-5424";
const QONTO_SECRET = process.env.QONTO_API_SECRET!;
const QONTO_BANK_ACCOUNT = "vanzone-explorer-5424-bank-account-1";

const AIRTABLE_TOKEN = process.env.AIRTABLE_API_KEY!;
const AIRTABLE_BASE = "app2FIBm3EPBmi9bL";
const AIRTABLE_FINANCES = "tblHD44V5TfUnEerY";
const AIRTABLE_TRANSACTIONS = "tblD59sKLpf4h4eDs";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function qontoFetch(path: string) {
  const res = await fetch(`https://thirdparty.qonto.com/v2${path}`, {
    headers: { Authorization: `${QONTO_SLUG}:${QONTO_SECRET}` },
  });
  if (!res.ok) throw new Error(`Qonto ${res.status}: ${await res.text()}`);
  return res.json();
}

async function airtableFetch(
  path: string,
  options?: RequestInit
) {
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

// Get existing Qonto IDs in Airtable to avoid duplicates
async function getExistingQontoIds(): Promise<Set<string>> {
  const ids = new Set<string>();
  let offset: string | undefined;

  do {
    const params = new URLSearchParams({ pageSize: "100", "fields[]": "Qonto ID" });
    if (offset) params.set("offset", offset);

    const data = await airtableFetch(
      `${AIRTABLE_BASE}/${AIRTABLE_TRANSACTIONS}?${params}`
    );
    for (const r of data.records) {
      const qid = r.fields["Qonto ID"];
      if (qid) ids.add(qid);
    }
    offset = data.offset;
  } while (offset);

  return ids;
}

function mapCategory(t: Record<string, unknown>): string {
  const cat = t.category as string || "";
  const name = ((t.clean_counterparty_name as string) || (t.label as string) || "").toLowerCase();
  if (cat === "marketing" || name.includes("facebk") || name.includes("meta")) return "Marketing";
  if (name.includes("wikicampers") || name.includes("yescapa")) return "Location van";
  if (cat === "fees" || (t.operation_type as string) === "qonto_fee" || name.includes("gocardless")) return "Frais bancaires";
  if (name.includes("notaire")) return "Juridique";
  if (name.includes("jules") || name.includes("gaveglio")) return "Apport";
  return "Frais bancaires";
}

const OP_MAP: Record<string, string> = {
  card: "Carte",
  transfer: "Virement",
  direct_debit: "Prélèvement",
  qonto_fee: "Qonto",
  income: "Virement",
};

const STATUS_MAP: Record<string, string> = {
  completed: "Complété",
  pending: "En cours",
  declined: "Annulé",
  reversed: "Annulé",
};

function buildNotes(t: Record<string, unknown>): string {
  const name = (t.clean_counterparty_name as string) || "N/A";
  const cat = ((t.cashflow_category as Record<string, string>)?.name) || "";
  const subcat = ((t.cashflow_subcategory as Record<string, string>)?.name) || "";
  const vatAmount = (t.vat_amount as number) || 0;
  const vatRate = (t.vat_rate as number) || 0;
  const amount = t.amount as number;

  const lines = [
    `Libellé : ${t.label}`,
    `Fournisseur : ${name}`,
    `Montant : ${amount.toFixed(2)} €`,
    `HT : ${(amount - vatAmount).toFixed(2)} €`,
    `TVA : ${vatAmount.toFixed(2)} € (${vatRate.toFixed(0)}%)`,
    `Date émission : ${(t.emitted_at as string || "N/A").slice(0, 19).replace("T", " ")}`,
    `Date règlement : ${(t.settled_at as string || "N/A").slice(0, 19).replace("T", " ")}`,
    `Type : ${t.side} (${t.operation_type})`,
  ];
  if (t.card_last_digits) lines.push(`Carte : *${t.card_last_digits}`);
  lines.push(`Statut : ${t.status}`);
  lines.push(`Catégorie : ${cat}`);
  if (subcat) lines.push(`Sous-catégorie : ${subcat}`);
  lines.push(`Solde après : ${((t.settled_balance as number) || 0).toFixed(2)} €`);
  lines.push(`Qonto ID : ${t.id}`);

  return lines.join("\n");
}

// ── Main sync ────────────────────────────────────────────────────────────────

async function syncQontoToAirtable() {
  // 1. Get all Qonto transactions
  const qontoData = await qontoFetch(
    `/transactions?slug=${QONTO_BANK_ACCOUNT}&per_page=100&sort_by=settled_at:desc`
  );
  const transactions = qontoData.transactions as Record<string, unknown>[];

  // 2. Get existing IDs in Airtable
  const existingIds = await getExistingQontoIds();

  // 3. Filter new transactions
  const newTxs = transactions.filter((t) => !existingIds.has(t.id as string));

  if (newTxs.length === 0) {
    return { synced: 0, message: "Aucune nouvelle transaction" };
  }

  // 4. Insert into Transactions Qonto table
  const transactionRecords = newTxs.map((t) => {
    const amount = t.amount as number;
    const vatAmount = (t.vat_amount as number) || 0;
    const vatRate = (t.vat_rate as number) || 0;
    const subcat = ((t.cashflow_subcategory as Record<string, string>)?.name) || "";

    return {
      fields: {
        Fournisseur: (t.clean_counterparty_name as string) || (t.label as string),
        "Libellé": t.label,
        Date: (t.settled_at as string)?.slice(0, 10) || null,
        "Montant TTC": amount,
        "Montant HT": Math.round((amount - vatAmount) * 100) / 100,
        TVA: vatAmount,
        "Taux TVA": vatRate ? vatRate / 100 : 0,
        Type: t.side === "credit" ? "Revenu" : "Dépense",
        "Moyen de paiement": OP_MAP[(t.operation_type as string)] || "Autre",
        "Catégorie Qonto": ((t.cashflow_category as Record<string, string>)?.name) || "",
        "Sous-catégorie": subcat,
        Carte: t.card_last_digits ? `*${t.card_last_digits}` : "",
        Statut: STATUS_MAP[(t.status as string)] || "Complété",
        "Solde après": (t.settled_balance as number) || 0,
        "Qonto ID": t.id,
        Notes: buildNotes(t),
      },
    };
  });

  // 5. Insert into Finances table
  const financeRecords = newTxs.map((t) => {
    const amount = t.amount as number;
    const isCredit = t.side === "credit";
    const subcat = ((t.cashflow_subcategory as Record<string, string>)?.name) || "";

    return {
      fields: {
        Date: (t.settled_at as string)?.slice(0, 10) || null,
        Description: (t.clean_counterparty_name as string) || (t.label as string),
        Montant: isCredit ? amount : -amount,
        "Catégorie": mapCategory(t),
        "Sous-catégorie": subcat,
        Type: isCredit ? "Entrée" : "Sortie",
        "Moyen de paiement": OP_MAP[(t.operation_type as string)] || "Autre",
        Notes: `Libellé: ${t.label} | TVA: ${((t.vat_amount as number) || 0).toFixed(2)}€ | Solde: ${((t.settled_balance as number) || 0).toFixed(2)}€`,
      },
    };
  });

  // 6. Send to Airtable in batches of 10
  let createdTransactions = 0;
  let createdFinances = 0;

  for (let i = 0; i < transactionRecords.length; i += 10) {
    const batch = transactionRecords.slice(i, i + 10);
    const result = await airtableFetch(`${AIRTABLE_BASE}/${AIRTABLE_TRANSACTIONS}`, {
      method: "POST",
      body: JSON.stringify({ records: batch }),
    });
    createdTransactions += result.records.length;
  }

  for (let i = 0; i < financeRecords.length; i += 10) {
    const batch = financeRecords.slice(i, i + 10);
    const result = await airtableFetch(`${AIRTABLE_BASE}/${AIRTABLE_FINANCES}`, {
      method: "POST",
      body: JSON.stringify({ records: batch }),
    });
    createdFinances += result.records.length;
  }

  return {
    synced: newTxs.length,
    transactions: createdTransactions,
    finances: createdFinances,
    message: `${newTxs.length} nouvelles transactions synchronisées`,
  };
}

// ── GET: manual trigger from admin ───────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cronSecret = searchParams.get("secret");

  if (cronSecret !== process.env.CRON_SECRET && !request.headers.get("cookie")?.includes("__clerk")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncQontoToAirtable();
    return NextResponse.json(result);
  } catch (error) {
    console.error("[sync-qonto] Error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

// ── POST: Qonto webhook (real-time) ─────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function POST(request: Request) {
  // Qonto sends webhook events as POST
  // We don't validate the specific event — just trigger a full sync
  // This is safer than parsing individual events (handles retries, ordering)
  try {
    const result = await syncQontoToAirtable();
    console.log(`[sync-qonto] Webhook sync: ${result.message}`);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[sync-qonto] Webhook error:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
