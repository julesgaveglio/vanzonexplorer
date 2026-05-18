import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { getGmailAccessToken } from "@/lib/gmail/client";

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";

// ── French month mapping ──────────────────────────────────────────────────────
const FRENCH_MONTHS: Record<string, string> = {
  janvier: "01",
  février: "02",
  mars: "03",
  avril: "04",
  mai: "05",
  juin: "06",
  juillet: "07",
  août: "08",
  septembre: "09",
  octobre: "10",
  novembre: "11",
  décembre: "12",
};

// ── Gmail helpers ─────────────────────────────────────────────────────────────

interface GmailMessage {
  id: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    parts?: Array<{
      mimeType: string;
      body: { data?: string };
      parts?: Array<{ mimeType: string; body: { data?: string } }>;
    }>;
    body?: { data?: string };
  };
}

async function searchGmailMessages(
  accessToken: string,
  query: string
): Promise<Array<{ id: string }>> {
  const allMessages: Array<{ id: string }> = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(`${GMAIL_API}/messages`);
    url.searchParams.set("q", query);
    url.searchParams.set("maxResults", "50");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) break;

    const data = (await res.json()) as {
      messages?: Array<{ id: string }>;
      nextPageToken?: string;
    };

    if (data.messages) allMessages.push(...data.messages);
    pageToken = data.nextPageToken;
  } while (pageToken);

  return allMessages;
}

async function getGmailMessage(
  accessToken: string,
  messageId: string
): Promise<GmailMessage | null> {
  const res = await fetch(`${GMAIL_API}/messages/${messageId}?format=full`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  return (await res.json()) as GmailMessage;
}

function extractHtmlBody(message: GmailMessage): string {
  // Try nested parts first (multipart/alternative inside multipart/mixed)
  if (message.payload.parts) {
    for (const part of message.payload.parts) {
      if (part.parts) {
        const htmlPart = part.parts.find((p) => p.mimeType === "text/html");
        if (htmlPart?.body?.data) {
          return Buffer.from(
            htmlPart.body.data.replace(/-/g, "+").replace(/_/g, "/"),
            "base64"
          ).toString("utf-8");
        }
      }
      if (part.mimeType === "text/html" && part.body?.data) {
        return Buffer.from(
          part.body.data.replace(/-/g, "+").replace(/_/g, "/"),
          "base64"
        ).toString("utf-8");
      }
    }
  }
  // Fallback: direct body
  if (message.payload.body?.data) {
    return Buffer.from(
      message.payload.body.data.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    ).toString("utf-8");
  }
  return "";
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/?(p|div|td|th|tr|li|ul|ol|h[1-6])[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&euro;/g, "€")
    .replace(/&#8364;/g, "€")
    .replace(/\s+/g, " ")
    .trim();
}

// ── Date parsing ──────────────────────────────────────────────────────────────

/** "Lundi 27 juillet 2026" → "2026-07-27" */
function parseFrenchDate(text: string): string | null {
  const match = text.match(/(\d{1,2})\s+([\wéûà]+)\s+(\d{4})/i);
  if (!match) return null;
  const [, day, monthName, year] = match;
  const month = FRENCH_MONTHS[monthName.toLowerCase()];
  if (!month) return null;
  return `${year}-${month}-${day.padStart(2, "0")}`;
}

/** "10/05/2026" → "2026-05-10" */
function parseDdMmYyyy(text: string): string | null {
  const match = text.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

/** "680,40" or "1 200,50" → 680.40 */
function parseEuroAmount(text: string): number | null {
  const cleaned = text.replace(/\s/g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// ── Reservation interface ─────────────────────────────────────────────────────

interface ParsedReservation {
  platform: "yescapa" | "wikicampers";
  platform_ref: string;
  van_name: string | null;
  start_date: string; // YYYY-MM-DD
  end_date: string;
  revenue: number | null;
  insurance: string | null;
  km_included: string | null;
  travelers: number | null;
  destination: string | null;
  client_name: string | null;
  gmail_message_id: string;
}

// ── Yescapa parser ────────────────────────────────────────────────────────────

function parseYescapaEmail(
  html: string,
  messageId: string
): ParsedReservation | null {
  // Reference number (at least 5 digits to avoid matching #0 from CSS/tracking)
  const refMatch = html.match(/réservation\s*(?::\s*)?#(\d{5,})/i) ?? html.match(/#(\d{5,})/);
  if (!refMatch) return null;

  // Extract table data using th/td pairs
  const getTableValue = (label: string): string => {
    // Match <th>Label</th> followed by <td> content
    const regex = new RegExp(
      `<th[^>]*>[^<]*${label}[^<]*</th>\\s*<td[^>]*>([\\s\\S]*?)</td>`,
      "i"
    );
    const match = html.match(regex);
    if (!match) return "";
    return match[1];
  };

  const departCell = getTableValue("Départ");
  const retourCell = getTableValue("Retour");
  const vehiculeCell = getTableValue("Véhicule");
  const remunerationCell = getTableValue("Rémunération");
  const assuranceCell = getTableValue("Assurance");
  const kmCell = getTableValue("Km inclus");

  // Parse depart/retour: extract text from <strong>
  const strongRegex = /<strong[^>]*>([\s\S]*?)<\/strong>/i;
  const departStrong = departCell.match(strongRegex)?.[1] ?? "";
  const retourStrong = retourCell.match(strongRegex)?.[1] ?? "";

  const startDate = parseFrenchDate(stripHtml(departStrong));
  const endDate = parseFrenchDate(stripHtml(retourStrong));

  if (!startDate || !endDate) return null;

  // Vehicle name from <a> tag inside <strong>
  const vanNameMatch = vehiculeCell.match(/<a[^>]*>([^<]+)<\/a>/i);
  const vanName = vanNameMatch ? vanNameMatch[1].trim() : stripHtml(vehiculeCell.match(strongRegex)?.[1] ?? "");

  // Revenue
  const revenueText = stripHtml(remunerationCell.match(strongRegex)?.[1] ?? "");
  const revenueMatch = revenueText.match(/([\d\s,]+)\s*€/);
  const revenue = revenueMatch ? parseEuroAmount(revenueMatch[1]) : null;

  // Insurance
  const insurance = stripHtml(assuranceCell.match(strongRegex)?.[1] ?? "") || null;

  // Km
  const kmIncluded = stripHtml(kmCell.match(strongRegex)?.[1] ?? "") || null;

  return {
    platform: "yescapa",
    platform_ref: refMatch[1],
    van_name: vanName || null,
    start_date: startDate,
    end_date: endDate,
    revenue,
    insurance,
    km_included: kmIncluded,
    travelers: null,
    destination: null,
    client_name: null,
    gmail_message_id: messageId,
  };
}

// ── Wikicampers parser ────────────────────────────────────────────────────────

function parseWikicampersEmail(
  html: string,
  messageId: string
): ParsedReservation | null {
  const text = stripHtml(html);

  const refMatch = text.match(/N°\s*de\s*réservation\s*(\d+)/i);
  if (!refMatch) return null;

  const vehiculeMatch = text.match(/Véhicule\s+(.+?)\s+Départ/i);
  const departMatch = text.match(/Départ\s+(\d{2}\/\d{2}\/\d{4})/i);
  const retourMatch = text.match(/Retour\s+(\d{2}\/\d{2}\/\d{4})/i);
  const voyageursMatch = text.match(/Voyageurs\s+(\d+)/i);
  const destinationMatch = text.match(/Destination\s+(.+?)\s+Kilométrage/i);
  const gainMatch = text.match(/Votre gain\s+([\d\s,]+)\s*€/i);

  const startDate = departMatch ? parseDdMmYyyy(departMatch[1]) : null;
  const endDate = retourMatch ? parseDdMmYyyy(retourMatch[1]) : null;

  if (!startDate || !endDate) return null;

  return {
    platform: "wikicampers",
    platform_ref: refMatch[1],
    van_name: vehiculeMatch ? vehiculeMatch[1].trim() : null,
    start_date: startDate,
    end_date: endDate,
    revenue: gainMatch ? parseEuroAmount(gainMatch[1]) : null,
    insurance: null,
    km_included: null,
    travelers: voyageursMatch ? parseInt(voyageursMatch[1], 10) : null,
    destination: destinationMatch ? destinationMatch[1].trim() : null,
    client_name: null,
    gmail_message_id: messageId,
  };
}

// ── Wikicampers locataire name enrichment ─────────────────────────────────────

async function fetchWikicampersClientNames(
  accessToken: string
): Promise<Map<string, string>> {
  const namesByRef = new Map<string, string>();

  const queries = [
    'from:contact@infos.wikicampers.fr subject:"Contrat de fin de location"',
    'from:contact@infos.wikicampers.fr subject:"Contrat début de location"',
  ];

  for (const query of queries) {
    const messages = await searchGmailMessages(accessToken, query);

    for (const { id } of messages) {
      try {
        const msg = await getGmailMessage(accessToken, id);
        if (!msg) continue;

        const html = extractHtmlBody(msg);
        const text = stripHtml(html);

        // Extract reservation ref
        const refMatch = text.match(/N°\s*de\s*réservation\s*(\d+)/i)
          ?? text.match(/réservation\s*n°\s*(\d+)/i)
          ?? text.match(/réservation\s+(\d+)/i);
        if (!refMatch) continue;

        // Extract "Bonjour Prénom" pattern
        const nameMatch = text.match(/Bonjour\s+([A-ZÀ-Ü][a-zà-ü]+)/);
        if (nameMatch && !namesByRef.has(refMatch[1])) {
          namesByRef.set(refMatch[1], nameMatch[1]);
        }
      } catch {
        // Skip individual message errors
      }
    }
  }

  return namesByRef;
}

// ── Status computation ────────────────────────────────────────────────────────

function computeStatus(
  startDate: string,
  endDate: string
): "upcoming" | "in_progress" | "completed" {
  const today = new Date().toISOString().slice(0, 10);
  if (endDate < today) return "completed";
  if (startDate <= today && endDate >= today) return "in_progress";
  return "upcoming";
}

// ── Main route ────────────────────────────────────────────────────────────────

export async function POST() {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const errors: string[] = [];
  const reservations: ParsedReservation[] = [];

  try {
    const accessToken = await getGmailAccessToken();

    // 1. Fetch Yescapa confirmation emails
    const yescapaMessages = await searchGmailMessages(
      accessToken,
      'from:notifications@yescapa.com subject:"réservation instantanée"'
    );

    for (const { id } of yescapaMessages) {
      try {
        const msg = await getGmailMessage(accessToken, id);
        if (!msg) continue;
        const html = extractHtmlBody(msg);
        const parsed = parseYescapaEmail(html, id);
        if (parsed) {
          reservations.push(parsed);
        } else {
          errors.push(`Yescapa: failed to parse message ${id}`);
        }
      } catch (e) {
        errors.push(
          `Yescapa: error on message ${id}: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    }

    // 2. Fetch Wikicampers confirmation emails
    const wikicampersMessages = await searchGmailMessages(
      accessToken,
      'from:contact@infos.wikicampers.fr subject:"confirmée par le locataire"'
    );

    for (const { id } of wikicampersMessages) {
      try {
        const msg = await getGmailMessage(accessToken, id);
        if (!msg) continue;
        const html = extractHtmlBody(msg);
        const parsed = parseWikicampersEmail(html, id);
        if (parsed) {
          reservations.push(parsed);
        } else {
          errors.push(`Wikicampers: failed to parse message ${id}`);
        }
      } catch (e) {
        errors.push(
          `Wikicampers: error on message ${id}: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    }

    // 3. Enrich Wikicampers client names
    try {
      const clientNames = await fetchWikicampersClientNames(accessToken);
      for (const resa of reservations) {
        if (resa.platform === "wikicampers" && !resa.client_name) {
          const name = clientNames.get(resa.platform_ref);
          if (name) resa.client_name = name;
        }
      }
    } catch (e) {
      errors.push(
        `Wikicampers client names: ${e instanceof Error ? e.message : String(e)}`
      );
    }

    // 4. Upsert into Supabase
    const supabase = createSupabaseAdmin();
    let synced = 0;

    for (const resa of reservations) {
      try {
        const status = computeStatus(resa.start_date, resa.end_date);

        const { error } = await supabase.from("reservations").upsert(
          {
            platform: resa.platform,
            platform_ref: resa.platform_ref,
            van_name: resa.van_name,
            start_date: resa.start_date,
            end_date: resa.end_date,
            revenue: resa.revenue,
            insurance: resa.insurance,
            km_included: resa.km_included,
            travelers: resa.travelers,
            destination: resa.destination,
            client_name: resa.client_name,
            status,
            gmail_message_id: resa.gmail_message_id,
          },
          { onConflict: "platform,platform_ref" }
        );

        if (error) {
          errors.push(
            `Upsert ${resa.platform}#${resa.platform_ref}: ${error.message}`
          );
        } else {
          synced++;
        }
      } catch (e) {
        errors.push(
          `Upsert ${resa.platform}#${resa.platform_ref}: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    }

    // 5. Update statuses for all existing reservations (in case dates have passed)
    try {
      const today = new Date().toISOString().slice(0, 10);

      await supabase
        .from("reservations")
        .update({ status: "completed" })
        .lt("end_date", today)
        .neq("status", "completed");

      await supabase
        .from("reservations")
        .update({ status: "in_progress" })
        .lte("start_date", today)
        .gte("end_date", today)
        .neq("status", "in_progress");
    } catch (e) {
      errors.push(
        `Status update: ${e instanceof Error ? e.message : String(e)}`
      );
    }

    return NextResponse.json({
      synced,
      total_found: reservations.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (e) {
    return NextResponse.json(
      {
        synced: 0,
        error: e instanceof Error ? e.message : String(e),
        errors,
      },
      { status: 500 }
    );
  }
}
