import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { createSupabaseAdmin } from "@/lib/supabase/server";

function sseEvent(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

interface FoundContact {
  name: string;
  role: string;
  email: string;
  priority: number;
  source?: string;
}

// ── Helpers ───────────────────────────────────────────────────────

function extractEmailsFromText(text: string): string[] {
  const regex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const found = text.match(regex) || [];
  return Array.from(new Set(found.filter(e =>
    !e.includes("example") && !e.includes("sentry") &&
    !e.includes("placeholder") && !e.startsWith("your@") &&
    !e.match(/\.(png|jpg|gif|svg|webp|pdf)$/i) &&
    !e.includes("@2x") && e.length < 80
  )));
}

function generatePatterns(domain: string): string[] {
  return [
    "contact", "info", "hello", "bonjour",
    "partenariat", "partenariats", "partnership", "partnerships",
    "marketing", "commercial", "pro", "b2b",
    "presse", "media", "communication", "direction",
  ].map(p => `${p}@${domain}`);
}

// Apply Hunter email pattern to a name (e.g. {f}.{last} → j.dupont)
function applyHunterPattern(pattern: string, firstName: string, lastName: string, domain: string): string | null {
  if (!pattern || !lastName) return null;
  const f = firstName?.charAt(0).toLowerCase() || "";
  const last = lastName.toLowerCase().replace(/\s+/g, "");
  const first = firstName?.toLowerCase().replace(/\s+/g, "") || "";
  return pattern
    .replace("{first}", first)
    .replace("{last}", last)
    .replace("{f}", f)
    .replace("{l}", last.charAt(0)) + `@${domain}`;
}

// ── Jina scraper ─────────────────────────────────────────────────

async function fetchWithJina(url: string): Promise<string> {
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        Authorization: `Bearer ${process.env.JINA_API_KEY}`,
        Accept: "text/plain",
        "X-Return-Format": "markdown",
        "X-Timeout": "15",
      },
    });
    if (!res.ok) return "";
    return await res.text();
  } catch {
    return "";
  }
}

// ── Hunter.io ────────────────────────────────────────────────────

interface HunterEmail {
  value: string;
  type: string;
  confidence: number;
  first_name?: string;
  last_name?: string;
  position?: string;
  department?: string;
}

async function searchHunter(domain: string): Promise<{
  emails: string[];
  contacts: FoundContact[];
  pattern: string | null;
}> {
  const empty = { emails: [], contacts: [], pattern: null };
  if (!process.env.HUNTER_API_KEY) return empty;
  try {
    const res = await fetch(
      `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&limit=10&api_key=${process.env.HUNTER_API_KEY}`
    );
    if (!res.ok) return empty;
    const data = await res.json();
    const emails: HunterEmail[] = data?.data?.emails || [];
    const pattern: string | null = data?.data?.pattern || null;

    const priorityOf = (e: HunterEmail) => {
      const pos = (e.position || "").toLowerCase();
      const dept = (e.department || "").toLowerCase();
      if (pos.includes("partner") || pos.includes("partenariat")) return 1;
      if (pos.includes("marketing") || dept.includes("marketing")) return 2;
      if (pos.includes("commercial") || pos.includes("sales")) return 3;
      if (pos.includes("direct") || pos.includes("ceo") || pos.includes("founder")) return 4;
      if (e.type === "generic") return 5;
      return 6;
    };

    const contacts: FoundContact[] = emails.map(e => ({
      name: [e.first_name, e.last_name].filter(Boolean).join(" ") || "—",
      role: e.position || e.type || "Contact",
      email: e.value,
      priority: priorityOf(e),
      source: "Hunter.io",
    }));

    return { emails: contacts.map(c => c.email), contacts, pattern };
  } catch {
    return empty;
  }
}

// ── Snov.io (v2) ─────────────────────────────────────────────────

async function getSnovToken(): Promise<string | null> {
  if (!process.env.SNOV_CLIENT_ID || !process.env.SNOV_CLIENT_SECRET) return null;
  try {
    const res = await fetch("https://api.snov.io/v1/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.SNOV_CLIENT_ID,
        client_secret: process.env.SNOV_CLIENT_SECRET,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.access_token || null;
  } catch {
    return null;
  }
}

async function searchSnov(domain: string): Promise<{ emails: string[]; contacts: FoundContact[] }> {
  const empty = { emails: [], contacts: [] };
  const token = await getSnovToken();
  if (!token) return empty;
  try {
    // v2 endpoint: GET with Bearer token
    const res = await fetch(
      `https://api.snov.io/v2/domain-emails-with-info?domain=${encodeURIComponent(domain)}&type=all&limit=10`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return empty;
    const data = await res.json();
    const emails: Array<{
      email: string;
      first_name?: string;
      last_name?: string;
      position?: string;
      status?: string;
    }> = data?.data || [];
    if (!emails.length) return empty;

    const priorityOf = (pos: string) => {
      const p = (pos || "").toLowerCase();
      if (p.includes("partner") || p.includes("partenariat")) return 1;
      if (p.includes("marketing")) return 2;
      if (p.includes("commercial") || p.includes("sales")) return 3;
      if (p.includes("direct") || p.includes("ceo") || p.includes("founder")) return 4;
      return 5;
    };

    const contacts: FoundContact[] = emails.map(e => ({
      name: [e.first_name, e.last_name].filter(Boolean).join(" ") || "—",
      role: e.position || "Contact",
      email: e.email,
      priority: priorityOf(e.position || ""),
      source: "Snov.io",
    }));

    return { emails: contacts.map(c => c.email), contacts };
  } catch {
    return empty;
  }
}

// ── ZeroBounce ────────────────────────────────────────────────────

type ZBStatus = "valid" | "invalid" | "catch-all" | "unknown" | "spamtrap" | "abuse" | "do_not_mail" | "disposable";

async function validateEmailsBatch(emails: string[]): Promise<Map<string, ZBStatus>> {
  const map = new Map<string, ZBStatus>();
  if (!process.env.ZEROBOUNCE_API_KEY || !emails.length) return map;

  const toValidate = emails.slice(0, 10);
  try {
    const res = await fetch("https://api.zerobounce.net/v2/validatebatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.ZEROBOUNCE_API_KEY,
        email_batch: toValidate.map(email => ({ email_address: email, ip_address: "" })),
      }),
    });
    if (!res.ok) return map;
    const data = await res.json();
    for (const r of (data.email_batch || []) as Array<{ address: string; status: ZBStatus }>) {
      map.set((r.address || "").toLowerCase(), r.status);
    }
  } catch {
    // non-blocking
  }
  return map;
}

// ── Main handler ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { prospectId, website }: { prospectId: string; website: string } = body;

  if (!prospectId || !website) {
    return new Response(
      `data: ${JSON.stringify({ type: "log", level: "error", message: "prospectId et website sont requis" })}\n\n`,
      { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } }
    );
  }

  let domain = "";
  try {
    domain = new URL(website.startsWith("http") ? website : `https://${website}`)
      .hostname.replace(/^www\./, "");
  } catch {
    domain = website.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(sseEvent(data)));

      try {
        const baseUrl = (website.startsWith("http") ? website : `https://${website}`).replace(/\/$/, "");
        send({ type: "log", level: "info", message: `Enrichissement multi-sources pour ${domain}...` });

        // ── Phase 1 : Discovery en parallèle ─────────────────────

        const jinaPages = [
          baseUrl,
          `${baseUrl}/contact`,
          `${baseUrl}/contact-us`,
          `${baseUrl}/a-propos`,
          `${baseUrl}/about`,
          `${baseUrl}/about-us`,
          `${baseUrl}/equipe`,
          `${baseUrl}/team`,
          `${baseUrl}/partenariats`,
          `${baseUrl}/partenariat`,
          `${baseUrl}/presse`,
          `${baseUrl}/pro`,
        ];

        const [jinaContents, hunterResult, snovResult] = await Promise.all([
          Promise.all(jinaPages.map(url => fetchWithJina(url))),
          (async () => {
            send({ type: "log", level: "info", message: `Hunter.io → ${domain}...` });
            const r = await searchHunter(domain);
            send({
              type: "log",
              level: r.emails.length > 0 ? "success" : "info",
              message: `Hunter.io → ${r.emails.length} email(s)${r.pattern ? ` · pattern: ${r.pattern}` : ""}`,
            });
            return r;
          })(),
          (async () => {
            send({ type: "log", level: "info", message: `Snov.io → ${domain}...` });
            const r = await searchSnov(domain);
            send({
              type: "log",
              level: r.emails.length > 0 ? "success" : "info",
              message: `Snov.io → ${r.emails.length} email(s)`,
            });
            return r;
          })(),
        ]);

        // Jina stats
        const successPages = jinaContents.filter(c => c.length > 0).length;
        send({ type: "log", level: "info", message: `Jina → ${successPages}/${jinaPages.length} page(s) récupérée(s)` });

        // Regex on FULL content (before any truncation)
        const fullJinaText = jinaContents.join("\n\n");
        const regexEmails = extractEmailsFromText(fullJinaText).filter(e => e.includes(domain));
        if (regexEmails.length > 0) {
          send({ type: "log", level: "info", message: `Regex → ${regexEmails.length} email(s) dans le HTML` });
        }

        // Apply Hunter pattern to generate emails from contact names
        const patternEmails: string[] = [];
        if (hunterResult.pattern) {
          for (const contact of [...hunterResult.contacts, ...snovResult.contacts]) {
            const parts = contact.name.split(" ");
            const firstName = parts[0] || "";
            const lastName = parts.slice(1).join(" ") || "";
            const generated = applyHunterPattern(hunterResult.pattern, firstName, lastName, domain);
            if (generated) patternEmails.push(generated);
          }
          if (patternEmails.length > 0) {
            send({ type: "log", level: "info", message: `Pattern Hunter (${hunterResult.pattern}) → ${patternEmails.length} email(s) généré(s)` });
          }
        }

        // ── Phase 2 : Merge & dedup ───────────────────────────────

        const discovered = Array.from(new Set([
          ...hunterResult.emails,
          ...snovResult.emails,
          ...regexEmails,
          ...patternEmails,
        ].map(e => e.toLowerCase().trim())));

        // Always generate generic patterns for ZeroBounce validation
        const genericPatterns = generatePatterns(domain);

        send({ type: "log", level: "info", message: `${discovered.length} email(s) trouvé(s) — validation ZeroBounce en cours...` });

        // ── Phase 3 : ZeroBounce ──────────────────────────────────

        // If emails found → validate them. Always validate top generic patterns too.
        const toValidate = Array.from(new Set([...discovered, ...genericPatterns])).slice(0, 10);
        const zbMap = await validateEmailsBatch(toValidate);

        const validFound = Array.from(zbMap.entries())
          .filter(([, s]) => s === "valid" || s === "catch-all")
          .map(([e]) => e);
        const invalidFound = Array.from(zbMap.entries())
          .filter(([, s]) => s === "invalid" || s === "spamtrap" || s === "abuse")
          .map(([e]) => e);

        send({
          type: "log",
          level: validFound.length > 0 ? "success" : "info",
          message: `ZeroBounce → ${validFound.length} valide(s) · ${invalidFound.length} invalide(s) · ${zbMap.size - validFound.length - invalidFound.length} inconnu(s)`,
        });

        // Keep: explicitly valid/catch-all + unvalidated discovered emails (not in zbMap as invalid)
        const finalEmails = Array.from(new Set([
          ...validFound,
          ...discovered.filter(e => !zbMap.has(e)), // not checked → keep
        ].filter(e => !invalidFound.includes(e))));

        // ── Phase 4 : Groq consolidation ─────────────────────────

        send({ type: "log", level: "info", message: `Groq → consolidation et priorisation...` });

        const allContacts: FoundContact[] = [...hunterResult.contacts, ...snovResult.contacts];

        // Build truncated Jina context for Groq (only what's needed)
        const pageLabels = ["ACCUEIL", "CONTACT", "CONTACT-US", "À PROPOS", "ABOUT", "ABOUT-US", "ÉQUIPE", "TEAM", "PARTENARIATS", "PARTENARIAT", "PRESSE", "PRO"];
        const jinaContext = jinaContents
          .map((c, i) => c ? `=== ${pageLabels[i]} ===\n${c.substring(0, 600)}` : "")
          .filter(Boolean)
          .join("\n\n")
          .substring(0, 3000);

        const zbSummary = Array.from(zbMap.entries())
          .map(([e, s]) => `${e}: ${s}`)
          .join(", ");

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const groqResponse = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [{
            role: "user",
            content: `Expert prospection B2B. Domaine: ${domain}

EMAILS VALIDÉS ET TROUVÉS:
${finalEmails.join(", ") || "aucun trouvé — utilise les patterns génériques si pertinents"}

CONTACTS (Hunter + Snov):
${allContacts.map(c => `[${c.source}] ${c.name} · ${c.role} · ${c.email}`).join("\n") || "aucun"}

STATUTS ZEROBOUNCE:
${zbSummary || "non validés"}

CONTENU PAGES WEB:
${jinaContext}

Consolide, déduplique et classe par priorité : partenariat > marketing > commercial > direction > générique.
Inclus UNIQUEMENT les emails validés ou "catch-all" ou non vérifiés (jamais les "invalid").
Réponds UNIQUEMENT en JSON:
{"emails":["email@exemple.com"],"contacts":[{"name":"...","role":"...","email":"...","priority":1}]}`,
          }],
          temperature: 0.1,
          max_tokens: 1000,
        });

        interface EnrichResult { emails: string[]; contacts: FoundContact[] }
        let result: EnrichResult = { emails: finalEmails, contacts: allContacts };
        try {
          const match = (groqResponse.choices[0]?.message?.content || "").match(/\{[\s\S]*\}/);
          if (match) result = JSON.parse(match[0]);
        } catch {
          send({ type: "log", level: "info", message: "Groq parsing échoué → fallback données brutes" });
        }

        // Final safety filter: remove explicitly invalid emails
        result.emails = Array.from(new Set(
          (result.emails || finalEmails)
            .map((e: string) => e.toLowerCase().trim())
            .filter((e: string) => !invalidFound.includes(e))
        ));

        // ── Save ──────────────────────────────────────────────────

        const supabase = createSupabaseAdmin();
        await supabase.from("prospects").update({
          emails: result.emails,
          contacts: result.contacts || [],
          status: "enrichi",
          updated_at: new Date().toISOString(),
        }).eq("id", prospectId);

        send({
          type: "log",
          level: "success",
          message: `Terminé — ${result.emails.length} email(s) · ${(result.contacts || []).length} contact(s)`,
        });
        send({ type: "result", emails: result.emails, contacts: result.contacts || [] });
        send({ type: "done", count: result.emails.length + (result.contacts || []).length });

      } catch (err) {
        send({ type: "log", level: "error", message: `Erreur: ${err instanceof Error ? err.message : String(err)}` });
        send({ type: "done", count: 0 });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
