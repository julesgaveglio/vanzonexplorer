import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getGmailAccessToken } from "@/lib/gmail/client";
import { createSupabaseAdmin } from "@/lib/supabase/server";

// ── Types Calendar API ────────────────────────────────────────────────────────

interface CalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: { dateTime?: string };
  attendees?: Array<{ email: string }>;
}

interface CalendarListResponse {
  items?: CalendarEvent[];
}

// ── Calendriers a scanner ─────────────────────────────────────────────────────

const CALENDAR_IDS = [
  "vanzonexplorer@gmail.com",
  "00f18c34b62f318d6c78922b8fa0130997004f416f34426ab8c9248c204c7efa@group.calendar.google.com",
];

const VANZON_EMAILS = new Set([
  "vanzonexplorer@gmail.com",
  "00f18c34b62f318d6c78922b8fa0130997004f416f34426ab8c9248c204c7efa@group.calendar.google.com",
]);

// ── Helpers ───────────────────────────────────────────────────────────────────

function extractName(summary: string): string {
  // "X et Vanzon Explorer" → X
  const match = summary.match(/^(.+?)\s+et\s+Vanzon Explorer/i);
  return match ? match[1].trim() : summary.replace(/Vanzon Explorer/gi, "").trim();
}

function extractNotes(description: string): string | null {
  // Cherche le texte apres "préparation de notre réunion.:" jusqu'au prochain double saut de ligne
  const marker = "préparation de notre réunion.:";
  const idx = description.toLowerCase().indexOf(marker.toLowerCase());
  if (idx === -1) {
    // Fallback : chercher "préparation de notre réunion :"
    const marker2 = "préparation de notre réunion :";
    const idx2 = description.toLowerCase().indexOf(marker2.toLowerCase());
    if (idx2 === -1) return null;
    const after = description.slice(idx2 + marker2.length).trim();
    const end = after.indexOf("\n\n");
    return end === -1 ? after : after.slice(0, end).trim();
  }
  const after = description.slice(idx + marker.length).trim();
  const end = after.indexOf("\n\n");
  return end === -1 ? after : after.slice(0, end).trim();
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST() {
  const authResult = await requireAdmin();
  if (authResult instanceof NextResponse) return authResult;

  try {
    const accessToken = await getGmailAccessToken();
    const supabase = createSupabaseAdmin();

    const allEvents: CalendarEvent[] = [];

    // Fetch events from both calendars
    for (const calendarId of CALENDAR_IDS) {
      const url = new URL(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
      );
      url.searchParams.set("timeMin", "2025-01-01T00:00:00Z");
      url.searchParams.set("maxResults", "100");
      url.searchParams.set("singleEvents", "true");
      url.searchParams.set("orderBy", "startTime");

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        console.error(`Calendar API error for ${calendarId}: ${res.status}`);
        continue;
      }

      const data = (await res.json()) as CalendarListResponse;
      if (data.items) {
        allEvents.push(...data.items);
      }
    }

    // Filter: summary contains "Vanzon Explorer" AND description contains "Calendly"
    const closingEvents = allEvents.filter((ev) => {
      const summary = ev.summary ?? "";
      const description = ev.description ?? "";
      return (
        summary.includes("Vanzon Explorer") &&
        description.toLowerCase().includes("calendly")
      );
    });

    // Deduplicate by event id
    const uniqueEvents = new Map<string, CalendarEvent>();
    for (const ev of closingEvents) {
      uniqueEvents.set(ev.id, ev);
    }

    // Parse and upsert
    const rows = Array.from(uniqueEvents.values()).map((ev) => {
      const attendeeEmail =
        ev.attendees?.find((a) => !VANZON_EMAILS.has(a.email.toLowerCase()))?.email ?? null;

      return {
        calendar_event_id: ev.id,
        name: extractName(ev.summary ?? ""),
        email: attendeeEmail,
        phone: ev.location ?? null,
        scheduled_at: ev.start?.dateTime ?? null,
        notes: ev.description ? extractNotes(ev.description) : null,
      };
    });

    let synced = 0;

    if (rows.length > 0) {
      const { error } = await supabase
        .from("closing_calls")
        .upsert(rows, { onConflict: "calendar_event_id" });

      if (error) {
        console.error("Supabase upsert error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      synced = rows.length;
    }

    // Update status: if scheduled_at < now and status is 'upcoming', set to 'completed'
    const { error: updateError } = await supabase
      .from("closing_calls")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("status", "upcoming")
      .lt("scheduled_at", new Date().toISOString());

    if (updateError) {
      console.error("Status update error:", updateError);
    }

    return NextResponse.json({
      synced,
      total_found: uniqueEvents.size,
      message: `Sync terminee : ${synced} appel(s) synchronise(s)`,
    });
  } catch (err) {
    console.error("Closing calls sync error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erreur interne" },
      { status: 500 }
    );
  }
}
