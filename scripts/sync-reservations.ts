/**
 * One-shot script to sync Gmail reservations into Supabase
 * Usage: npx tsx scripts/sync-reservations.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";

const FRENCH_MONTHS: Record<string, string> = {
  janvier: "01", février: "02", mars: "03", avril: "04",
  mai: "05", juin: "06", juillet: "07", août: "08",
  septembre: "09", octobre: "10", novembre: "11", décembre: "12",
};

// ── Gmail auth ───────────────────────────────────────────────────────────────
async function getAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_GSC_CLIENT_ID!,
      client_secret: process.env.GOOGLE_GSC_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_GMAIL_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`Gmail auth failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

// ── Gmail helpers ────────────────────────────────────────────────────────────
async function searchMessages(token: string, query: string) {
  const all: Array<{ id: string }> = [];
  let pageToken: string | undefined;
  do {
    const url = new URL(`${GMAIL_API}/messages`);
    url.searchParams.set("q", query);
    url.searchParams.set("maxResults", "50");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) break;
    const data = await res.json();
    if (data.messages) all.push(...data.messages);
    pageToken = data.nextPageToken;
  } while (pageToken);
  return all;
}

async function getMessage(token: string, id: string) {
  const res = await fetch(`${GMAIL_API}/messages/${id}?format=full`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

function extractHtml(msg: any): string {
  if (msg.payload.parts) {
    for (const part of msg.payload.parts) {
      if (part.parts) {
        const h = part.parts.find((p: any) => p.mimeType === "text/html");
        if (h?.body?.data) return Buffer.from(h.body.data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
      }
      if (part.mimeType === "text/html" && part.body?.data)
        return Buffer.from(part.body.data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
    }
  }
  if (msg.payload.body?.data)
    return Buffer.from(msg.payload.body.data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8");
  return "";
}

function strip(html: string): string {
  return html.replace(/<br\s*\/?>/gi, " ").replace(/<\/?(p|div|td|th|tr|li|ul|ol|h[1-6])[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#8364;/g, "€")
    .replace(/&euro;/g, "€").replace(/\s+/g, " ").trim();
}

function parseFrenchDate(t: string): string | null {
  const m = t.match(/(\d{1,2})\s+([\wéûà]+)\s+(\d{4})/i);
  if (!m) return null;
  const mo = FRENCH_MONTHS[m[2].toLowerCase()];
  return mo ? `${m[3]}-${mo}-${m[1].padStart(2, "0")}` : null;
}

function parseDdMm(t: string): string | null {
  const m = t.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
}

function parseEuro(t: string): number | null {
  const n = parseFloat(t.replace(/\s/g, "").replace(",", "."));
  return isNaN(n) ? null : n;
}

// ── Parsers ──────────────────────────────────────────────────────────────────
function parseYescapa(html: string, messageId: string) {
  const ref = html.match(/réservation\s*(?::\s*)?#(\d{5,})/i) ?? html.match(/#(\d{5,})/);
  if (!ref) return null;

  const getVal = (label: string) => {
    const rx = new RegExp(`<th[^>]*>[^<]*${label}[^<]*</th>\\s*<td[^>]*>([\\s\\S]*?)</td>`, "i");
    return html.match(rx)?.[1] ?? "";
  };

  const strong = (s: string) => s.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i)?.[1] ?? "";
  const startDate = parseFrenchDate(strip(strong(getVal("Départ"))));
  const endDate = parseFrenchDate(strip(strong(getVal("Retour"))));
  if (!startDate || !endDate) return null;

  const vanLink = getVal("Véhicule").match(/<a[^>]*>([^<]+)<\/a>/i);
  const vanName = vanLink ? vanLink[1].trim() : strip(strong(getVal("Véhicule")));
  const revText = strip(strong(getVal("Rémunération")));
  const revMatch = revText.match(/([\d\s,]+)\s*€/);

  return {
    platform: "yescapa" as const, platform_ref: ref[1], van_name: vanName || null,
    start_date: startDate, end_date: endDate,
    revenue: revMatch ? parseEuro(revMatch[1]) : null,
    insurance: strip(strong(getVal("Assurance"))) || null,
    km_included: strip(strong(getVal("Km inclus"))) || null,
    travelers_count: null, destination: null, client_name: null,
    gmail_message_id: messageId,
  };
}

function parseWikicampers(html: string, messageId: string) {
  const text = strip(html);
  const ref = text.match(/N°\s*de\s*réservation\s*(\d+)/i);
  if (!ref) return null;

  const veh = text.match(/Véhicule\s+(.+?)\s+Départ/i);
  const dep = text.match(/Départ\s+(\d{2}\/\d{2}\/\d{4})/i);
  const ret = text.match(/Retour\s+(\d{2}\/\d{2}\/\d{4})/i);
  const voy = text.match(/Voyageurs\s+(\d+)/i);
  const dest = text.match(/Destination\s+(.+?)\s+Kilométrage/i);
  const gain = text.match(/Votre gain\s+([\d\s,]+)\s*€/i);

  const startDate = dep ? parseDdMm(dep[1]) : null;
  const endDate = ret ? parseDdMm(ret[1]) : null;
  if (!startDate || !endDate) return null;

  return {
    platform: "wikicampers" as const, platform_ref: ref[1],
    van_name: veh ? veh[1].trim() : null,
    start_date: startDate, end_date: endDate,
    revenue: gain ? parseEuro(gain[1]) : null,
    insurance: null, km_included: null,
    travelers_count: voy ? parseInt(voy[1]) : null,
    destination: dest ? dest[1].trim() : null,
    client_name: null, gmail_message_id: messageId,
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🔄 Syncing reservations from Gmail...\n");

  const token = await getAccessToken();
  console.log("✅ Gmail auth OK");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const reservations: any[] = [];
  const errors: string[] = [];

  // 1. Yescapa
  const yescapaMsgs = await searchMessages(token, 'from:notifications@yescapa.com subject:"réservation instantanée"');
  console.log(`📧 Yescapa: ${yescapaMsgs.length} emails trouvés`);

  for (const { id } of yescapaMsgs) {
    try {
      const msg = await getMessage(token, id);
      if (!msg) continue;
      const parsed = parseYescapa(extractHtml(msg), id);
      if (parsed) reservations.push(parsed);
      else errors.push(`Yescapa: parse failed for ${id}`);
    } catch (e: any) { errors.push(`Yescapa ${id}: ${e.message}`); }
  }

  // 2. Wikicampers
  const wikiMsgs = await searchMessages(token, 'from:contact@infos.wikicampers.fr subject:"confirmée par le locataire"');
  console.log(`📧 Wikicampers: ${wikiMsgs.length} emails trouvés`);

  for (const { id } of wikiMsgs) {
    try {
      const msg = await getMessage(token, id);
      if (!msg) continue;
      const parsed = parseWikicampers(extractHtml(msg), id);
      if (parsed) reservations.push(parsed);
      else errors.push(`Wikicampers: parse failed for ${id}`);
    } catch (e: any) { errors.push(`Wikicampers ${id}: ${e.message}`); }
  }

  // 3. Enrich Wikicampers client names
  console.log("\n🔍 Enrichissement noms locataires Wikicampers...");
  const nameQueries = [
    'from:contact@infos.wikicampers.fr subject:"Contrat de fin de location"',
    'from:contact@infos.wikicampers.fr subject:"Contrat début de location"',
  ];
  const namesByRef = new Map<string, string>();
  for (const q of nameQueries) {
    const msgs = await searchMessages(token, q);
    for (const { id } of msgs) {
      try {
        const msg = await getMessage(token, id);
        if (!msg) continue;
        const text = strip(extractHtml(msg));
        const ref = text.match(/location\s+(\d+)/i);
        const name = text.match(/Bonjour\s+([A-ZÀ-Ü][a-zà-ü]+)/);
        if (ref && name && !namesByRef.has(ref[1])) namesByRef.set(ref[1], name[1]);
      } catch {}
    }
  }
  console.log(`   Trouvé ${namesByRef.size} noms`);

  for (const r of reservations) {
    if (r.platform === "wikicampers" && !r.client_name) {
      const name = namesByRef.get(r.platform_ref);
      if (name) r.client_name = name;
    }
  }

  // 4. Upsert
  console.log(`\n💾 Upsert de ${reservations.length} réservations...`);
  let synced = 0;
  const today = new Date().toISOString().slice(0, 10);

  for (const r of reservations) {
    const status = r.end_date < today ? "completed" : (r.start_date <= today && r.end_date >= today) ? "in_progress" : "confirmed";
    const { error } = await supabase.from("reservations").upsert({
      ...r, status,
    }, { onConflict: "platform,platform_ref" });
    if (error) errors.push(`Upsert ${r.platform}#${r.platform_ref}: ${error.message}`);
    else synced++;
  }

  console.log(`\n✅ Synced: ${synced}/${reservations.length}`);
  if (errors.length) {
    console.log(`\n⚠️  Erreurs (${errors.length}):`);
    errors.forEach(e => console.log(`   - ${e}`));
  }

  // Print summary
  console.log("\n📊 Résumé:");
  for (const r of reservations) {
    console.log(`   ${r.platform.padEnd(12)} #${r.platform_ref}  ${r.start_date} → ${r.end_date}  ${r.van_name ?? "?"}  ${r.client_name ?? "—"}  ${r.revenue ?? "?"}€`);
  }
}

main().catch(console.error);
