/**
 * Agent: Sync Gmail reservations → Supabase → Google Calendar
 * Runs every 15 min via GitHub Actions.
 * Usage: npx tsx scripts/agents/sync-reservations-calendar.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { notifyTelegram } from "../lib/telegram";

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3/calendars";
const CALENDAR_ID = "vanzonexplorer@gmail.com";

const FRENCH_MONTHS: Record<string, string> = {
  janvier: "01", février: "02", mars: "03", avril: "04",
  mai: "05", juin: "06", juillet: "07", août: "08",
  septembre: "09", octobre: "10", novembre: "11", décembre: "12",
};

// Van name → Google Calendar colorId
const VAN_COLORS: Record<string, string> = {
  yoni: "9",    // blueberry (blue)
  xalbat: "6",  // tangerine (orange)
};

function getVanColor(vanName: string | null): string {
  if (!vanName) return "9";
  const lower = vanName.toLowerCase();
  for (const [key, color] of Object.entries(VAN_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return "9";
}

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

// ── Google Calendar helpers ──────────────────────────────────────────────────

function addOneDay(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

interface Reservation {
  id: string;
  platform: string;
  platform_ref: string;
  van_name: string | null;
  client_name: string | null;
  start_date: string;
  end_date: string;
  revenue: number | null;
  insurance: string | null;
  km_included: string | null;
  status: string;
  google_calendar_event_id: string | null;
}

async function createCalendarEvent(token: string, r: Reservation): Promise<string | null> {
  const platform = r.platform.charAt(0).toUpperCase() + r.platform.slice(1);
  const summary = `🚐 ${r.van_name ?? "Van"} — ${r.client_name ?? "Client"} (${platform})`;

  const descLines = [
    r.client_name ? `Client: ${r.client_name}` : null,
    `Plateforme: ${platform}`,
    `Ref: #${r.platform_ref}`,
    r.revenue != null ? `Revenu: ${r.revenue.toFixed(2).replace(".", ",")}€` : null,
    r.insurance ? `Assurance: ${r.insurance}` : null,
    r.km_included ? `Km inclus: ${r.km_included}` : null,
  ].filter(Boolean).join("\n");

  const body = {
    summary,
    description: descLines,
    start: { date: r.start_date },
    end: { date: addOneDay(r.end_date) }, // Google all-day end is exclusive
    colorId: getVanColor(r.van_name),
    extendedProperties: {
      private: { reservationKey: `${r.platform}:${r.platform_ref}` },
    },
  };

  const res = await fetch(
    `${CALENDAR_API}/${encodeURIComponent(CALENDAR_ID)}/events`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error(`   ❌ Calendar create failed for ${r.platform}#${r.platform_ref}: ${err}`);
    return null;
  }

  const event = await res.json();
  return event.id;
}

async function deleteCalendarEvent(token: string, eventId: string): Promise<boolean> {
  const res = await fetch(
    `${CALENDAR_API}/${encodeURIComponent(CALENDAR_ID)}/events/${eventId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.ok || res.status === 410; // 410 = already deleted
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🔄 Sync reservations → Supabase → Google Calendar\n");

  const token = await getAccessToken();
  console.log("✅ Auth OK");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const errors: string[] = [];

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 1: Gmail → Supabase (from sync-reservations.ts)
  // ═══════════════════════════════════════════════════════════════════════════

  const reservations: any[] = [];

  // 1. Yescapa
  const yescapaMsgs = await searchMessages(token, 'from:notifications@yescapa.com subject:"réservation instantanée"');
  console.log(`📧 Yescapa: ${yescapaMsgs.length} emails`);

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
  console.log(`📧 Wikicampers: ${wikiMsgs.length} emails`);

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

  for (const r of reservations) {
    if (r.platform === "wikicampers" && !r.client_name) {
      const name = namesByRef.get(r.platform_ref);
      if (name) r.client_name = name;
    }
  }

  // 4. Upsert to Supabase
  let gmailSynced = 0;
  const today = new Date().toISOString().slice(0, 10);

  for (const r of reservations) {
    const status = r.end_date < today ? "completed" : (r.start_date <= today && r.end_date >= today) ? "in_progress" : "confirmed";
    const { error } = await supabase.from("reservations").upsert({
      ...r, status,
    }, { onConflict: "platform,platform_ref" });
    if (error) errors.push(`Upsert ${r.platform}#${r.platform_ref}: ${error.message}`);
    else gmailSynced++;
  }

  console.log(`💾 Gmail → Supabase: ${gmailSynced}/${reservations.length}`);

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2: Supabase → Google Calendar (new events)
  // ═══════════════════════════════════════════════════════════════════════════

  const { data: pendingRows } = await supabase
    .from("reservations")
    .select("*")
    .is("google_calendar_event_id", null)
    .neq("status", "cancelled")
    .order("start_date", { ascending: true });

  let calendarCreated = 0;

  if (pendingRows && pendingRows.length > 0) {
    console.log(`\n📅 ${pendingRows.length} réservations à syncer vers Calendar...`);

    for (const row of pendingRows as Reservation[]) {
      const eventId = await createCalendarEvent(token, row);
      if (eventId) {
        const { error } = await supabase
          .from("reservations")
          .update({ google_calendar_event_id: eventId })
          .eq("id", row.id);
        if (error) {
          errors.push(`Calendar update DB for ${row.platform}#${row.platform_ref}: ${error.message}`);
        } else {
          calendarCreated++;
          console.log(`   ✅ ${row.van_name ?? "Van"} ${row.start_date} → ${row.end_date} (${row.client_name ?? "?"})`);
        }
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 3: Handle cancellations
  // ═══════════════════════════════════════════════════════════════════════════

  const { data: cancelledRows } = await supabase
    .from("reservations")
    .select("id, platform, platform_ref, google_calendar_event_id")
    .eq("status", "cancelled")
    .not("google_calendar_event_id", "is", null);

  let calendarDeleted = 0;

  if (cancelledRows && cancelledRows.length > 0) {
    console.log(`\n🗑️ ${cancelledRows.length} annulations à supprimer du Calendar...`);

    for (const row of cancelledRows) {
      const ok = await deleteCalendarEvent(token, row.google_calendar_event_id!);
      if (ok) {
        await supabase
          .from("reservations")
          .update({ google_calendar_event_id: null })
          .eq("id", row.id);
        calendarDeleted++;
        console.log(`   🗑️ Supprimé: ${row.platform}#${row.platform_ref}`);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 4: Telegram notification (only if changes)
  // ═══════════════════════════════════════════════════════════════════════════

  const hasChanges = calendarCreated > 0 || calendarDeleted > 0;

  if (hasChanges) {
    const lines = ["📅 Sync Réservations → Calendar"];
    if (calendarCreated > 0) lines.push(`✅ ${calendarCreated} événement(s) créé(s)`);
    if (calendarDeleted > 0) lines.push(`🗑️ ${calendarDeleted} annulation(s) supprimée(s)`);
    if (errors.length > 0) lines.push(`⚠️ ${errors.length} erreur(s)`);
    await notifyTelegram(lines.join("\n"));
  }

  console.log(`\n✅ Terminé — Calendar: +${calendarCreated} / -${calendarDeleted} | Erreurs: ${errors.length}`);
  if (errors.length > 0) {
    console.log("⚠️ Erreurs:");
    errors.forEach(e => console.log(`   - ${e}`));
  }
}

main().catch(async (err) => {
  console.error("❌ Fatal:", err);
  await notifyTelegram(`❌ Sync Réservations Calendar FAILED: ${err.message}`).catch(() => {});
  process.exit(1);
});
