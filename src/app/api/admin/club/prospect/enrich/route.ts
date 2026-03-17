import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { createSupabaseAdmin } from "@/lib/supabase/server";

function sseEvent(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

// ── Types ─────────────────────────────────────────────────────────

interface FoundContact {
  name: string;
  role: string;
  email: string;
  priority: number;
  source?: string;
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

function extractEmailsFromText(text: string): string[] {
  const regex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const found = text.match(regex) || [];
  return Array.from(new Set(found.filter(e =>
    !e.includes("example") && !e.includes("sentry") &&
    !e.includes("placeholder") && !e.startsWith("your@") &&
    !e.includes("@2x") && !e.includes(".png") && !e.includes(".jpg") &&
    e.length < 80
  )));
}

// ── Hunter.io ────────────────────────────────────────────────────

async function searchHunter(domain: string): Promise<{ emails: string[]; contacts: FoundContact[] }> {
  if (!process.env.HUNTER_API_KEY) return { emails: [], contacts: [] };
  try {
    const res = await fetch(
      `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&limit=10&api_key=${process.env.HUNTER_API_KEY}`
    );
    if (!res.ok) return { emails: [], contacts: [] };
    const data = await res.json();
    if (!data?.data?.emails?.length) return { emails: [], contacts: [] };

    const priorityOf = (e: { position?: string; department?: string; type?: string }) => {
      const pos = (e.position || "").toLowerCase();
      const dept = (e.department || "").toLowerCase();
      if (pos.includes("partner") || pos.includes("partenariat")) return 1;
      if (pos.includes("marketing") || dept.includes("marketing")) return 2;
      if (pos.includes("commercial") || pos.includes("sales")) return 3;
      if (pos.includes("direct") || pos.includes("ceo") || pos.includes("founder")) return 4;
      if (e.type === "generic") return 5;
      return 6;
    };

    const contacts: FoundContact[] = data.data.emails
      .sort((a: { position?: string; department?: string; type?: string }, b: { position?: string; department?: string; type?: string }) => priorityOf(a) - priorityOf(b))
      .map((e: { value: string; first_name?: string; last_name?: string; position?: string; type?: string; department?: string }) => ({
        name: [e.first_name, e.last_name].filter(Boolean).join(" ") || "—",
        role: e.position || e.type || "Contact",
        email: e.value,
        priority: priorityOf(e),
        source: "Hunter.io",
      }));

    return { emails: contacts.map(c => c.email), contacts };
  } catch {
    return { emails: [], contacts: [] };
  }
}

// ── Snov.io ───────────────────────────────────────────────────────

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
  const token = await getSnovToken();
  if (!token) return { emails: [], contacts: [] };
  try {
    const res = await fetch("https://api.snov.io/v1/get-domain-emails-with-info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ access_token: token, domain, type: "all", limit: 10, lastId: 0 }),
    });
    if (!res.ok) return { emails: [], contacts: [] };
    const data = await res.json();
    const emails: Array<{ email: string; firstName?: string; lastName?: string; position?: string; confidence?: number }> = data.emails || [];
    if (!emails.length) return { emails: [], contacts: [] };

    const priorityOf = (pos: string) => {
      const p = pos.toLowerCase();
      if (p.includes("partner") || p.includes("partenariat")) return 1;
      if (p.includes("marketing")) return 2;
      if (p.includes("commercial") || p.includes("sales")) return 3;
      if (p.includes("direct") || p.includes("ceo") || p.includes("founder")) return 4;
      return 5;
    };

    const contacts: FoundContact[] = emails.map(e => ({
      name: [e.firstName, e.lastName].filter(Boolean).join(" ") || "—",
      role: e.position || "Contact",
      email: e.email,
      priority: priorityOf(e.position || ""),
      source: "Snov.io",
    }));

    return { emails: contacts.map(c => c.email), contacts };
  } catch {
    return { emails: [], contacts: [] };
  }
}

// ── ZeroBounce ────────────────────────────────────────────────────

type ZBStatus = "valid" | "invalid" | "catch-all" | "unknown" | "spamtrap" | "abuse" | "do_not_mail" | "disposable";

interface ZBResult {
  email: string;
  status: ZBStatus;
  sub_status?: string;
}

async function validateEmailsBatch(emails: string[]): Promise<Map<string, ZBStatus>> {
  const map = new Map<string, ZBStatus>();
  if (!process.env.ZEROBOUNCE_API_KEY || !emails.length) return map;

  // Limit to 10 to preserve monthly quota
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
    const results: ZBResult[] = data.email_batch || [];
    for (const r of results) {
      map.set(r.email.toLowerCase(), r.status);
    }
  } catch {
    // ZeroBounce failure is non-blocking
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
    domain = new URL(website.startsWith("http") ? website : `https://${website}`).hostname.replace(/^www\./, "");
  } catch {
    domain = website.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(sseEvent(data)));
      };

      try {
        const baseUrl = (website.startsWith("http") ? website : `https://${website}`).replace(/\/$/, "");

        send({ type: "log", level: "info", message: `Enrichissement multi-sources pour ${domain}...` });

        // ── Phase 1 : Discovery (tout en parallèle) ───────────────

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
          // Jina — scrape all pages in parallel
          Promise.all(jinaPages.map(url => fetchWithJina(url))).then(contents => {
            const count = contents.filter(c => c.length > 0).length;
            send({ type: "log", level: "info", message: `Jina → ${count}/${jinaPages.length} page(s) récupérée(s)` });
            return contents;
          }),
          // Hunter.io
          (async () => {
            send({ type: "log", level: "info", message: `Hunter.io → recherche sur ${domain}...` });
            const r = await searchHunter(domain);
            send({
              type: "log",
              level: r.emails.length > 0 ? "success" : "info",
              message: `Hunter.io → ${r.emails.length} email(s)`,
            });
            return r;
          })(),
          // Snov.io
          (async () => {
            send({ type: "log", level: "info", message: `Snov.io → recherche sur ${domain}...` });
            const r = await searchSnov(domain);
            send({
              type: "log",
              level: r.emails.length > 0 ? "success" : "info",
              message: `Snov.io → ${r.emails.length} email(s)`,
            });
            return r;
          })(),
        ]);

        // Build combined Jina content
        const pageLabels = ["ACCUEIL", "CONTACT", "CONTACT-US", "À PROPOS", "ABOUT", "ABOUT-US", "ÉQUIPE", "TEAM", "PARTENARIATS", "PARTENARIAT", "PRESSE", "PRO"];
        const jinaContent = jinaContents
          .map((c, i) => c ? `=== ${pageLabels[i]} ===\n${c.substring(0, 800)}` : "")
          .filter(Boolean)
          .join("\n\n");

        // Regex extract from Jina content
        const regexEmails = extractEmailsFromText(jinaContent);
        if (regexEmails.length > 0) {
          send({ type: "log", level: "info", message: `Regex → ${regexEmails.length} email(s) dans le HTML` });
        }

        // ── Phase 2 : Merge & dedup ───────────────────────────────

        const allEmailsRaw = [
          ...hunterResult.emails,
          ...snovResult.emails,
          ...regexEmails,
        ];
        const allEmails = Array.from(new Set(allEmailsRaw.map(e => e.toLowerCase().trim())));

        send({ type: "log", level: "info", message: `Total avant validation : ${allEmails.length} email(s) unique(s)` });

        // ── Phase 3 : ZeroBounce validation ──────────────────────

        let zbMap = new Map<string, ZBStatus>();
        if (allEmails.length > 0) {
          send({ type: "log", level: "info", message: `ZeroBounce → validation de ${Math.min(allEmails.length, 10)} email(s)...` });
          zbMap = await validateEmailsBatch(allEmails);

          const validCount = Array.from(zbMap.values()).filter(s => s === "valid" || s === "catch-all").length;
          const invalidCount = Array.from(zbMap.values()).filter(s => s === "invalid").length;
          send({
            type: "log",
            level: "info",
            message: `ZeroBounce → ${validCount} valide(s) · ${invalidCount} invalide(s) · ${zbMap.size - validCount - invalidCount} inconnu(s)`,
          });
        }

        // Filter: keep valid + catch-all + unvalidated (not explicitly invalid)
        const validEmails = allEmails.filter(e => {
          const status = zbMap.get(e);
          if (!status) return true; // not checked → keep
          return status === "valid" || status === "catch-all" || status === "unknown";
        });

        // ── Phase 4 : Groq consolidation ─────────────────────────

        send({ type: "log", level: "info", message: `Groq → consolidation et priorisation...` });

        // Merge contacts from all sources
        const allContacts: FoundContact[] = [...hunterResult.contacts, ...snovResult.contacts];

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const groqResponse = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [{
            role: "user",
            content: `Expert prospection B2B. Domaine: ${domain}

EMAILS VALIDÉS (Hunter + Snov + scraping):
${validEmails.join(", ") || "aucun"}

CONTACTS IDENTIFIÉS:
${allContacts.map(c => `[${c.source}] ${c.name} · ${c.role} · ${c.email}`).join("\n") || "aucun"}

STATUTS ZEROBOUNCE:
${Array.from(zbMap.entries()).map(([e, s]) => `${e}: ${s}`).join(", ") || "non validés"}

CONTENU PAGES WEB:
${jinaContent.substring(0, 3000)}

Consolide et déduplique. Classe par priorité : partenariat > marketing > commercial > direction > générique.
Réponds UNIQUEMENT en JSON:
{"emails":["email@exemple.com"],"contacts":[{"name":"...","role":"...","email":"...","priority":1}]}`,
          }],
          temperature: 0.1,
          max_tokens: 1500,
        });

        const raw = groqResponse.choices[0]?.message?.content || "{}";
        interface EnrichResult {
          emails: string[];
          contacts: FoundContact[];
        }
        let result: EnrichResult = { emails: validEmails, contacts: allContacts };
        try {
          const match = raw.match(/\{[\s\S]*\}/);
          if (match) result = JSON.parse(match[0]);
        } catch {
          send({ type: "log", level: "info", message: "Groq parsing échoué → fallback données brutes" });
        }

        // Final dedup + keep only non-invalid emails
        result.emails = Array.from(new Set(
          (result.emails || validEmails).map((e: string) => e.toLowerCase().trim())
            .filter((e: string) => zbMap.get(e) !== "invalid" && zbMap.get(e) !== "spamtrap" && zbMap.get(e) !== "abuse")
        ));

        // ── Save ──────────────────────────────────────────────────

        const supabase = createSupabaseAdmin();
        await supabase
          .from("prospects")
          .update({
            emails: result.emails,
            contacts: result.contacts || [],
            status: "enrichi",
            updated_at: new Date().toISOString(),
          })
          .eq("id", prospectId);

        send({
          type: "log",
          level: "success",
          message: `Enrichissement terminé — ${result.emails.length} email(s) · ${(result.contacts || []).length} contact(s)`,
        });
        send({ type: "result", emails: result.emails, contacts: result.contacts || [] });
        send({ type: "done", count: result.emails.length + (result.contacts || []).length });

      } catch (error) {
        send({ type: "log", level: "error", message: `Erreur: ${error instanceof Error ? error.message : String(error)}` });
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
