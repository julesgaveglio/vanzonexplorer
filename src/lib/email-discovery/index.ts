/**
 * email-discovery — Agent de scraping d'email réutilisable
 *
 * Pipeline complet (waterfall + parallèle) :
 *   1. Jina AI       — scraping 12 pages du site (contact, about, team, presse…)
 *   2. Hunter.io     — domain search + pattern email détecté
 *   3. Snov.io       — second source email B2B
 *   4. Regex         — extraction brute depuis le HTML Jina (filtré sur le domaine)
 *   5. Pattern apply — génère des emails depuis les noms trouvés via le pattern Hunter
 *   6. ZeroBounce    — validation batch (valid / catch-all / invalid)
 *   7. Groq          — consolidation et priorisation finale
 *
 * Usage :
 *   const result = await discoverEmails("vanlife-mag.fr", { onLog })
 *   // result.emails    → string[]
 *   // result.contacts  → FoundContact[]
 *   // result.bestEmail → string | null
 */

import Groq from "groq-sdk";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface FoundContact {
  name: string;
  role: string;
  email: string;
  priority: number;
  source?: string;
}

export type ZBStatus =
  | "valid" | "invalid" | "catch-all" | "unknown"
  | "spamtrap" | "abuse" | "do_not_mail" | "disposable";

export interface EmailDiscoveryResult {
  emails: string[];
  contacts: FoundContact[];
  bestEmail: string | null;
  zbStatuses: Record<string, ZBStatus>;
  sourceSummary: {
    hunter: number;
    snov: number;
    regex: number;
    pattern: number;
    zbValid: number;
  };
}

export interface EmailDiscoveryOptions {
  /** Callback pour logs en temps réel (ex: SSE stream) */
  onLog?: (level: "info" | "success" | "error", message: string) => void;
  /** Contexte pour priorisation Groq (ex: "partenariat marque outdoor") */
  context?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function log(
  onLog: EmailDiscoveryOptions["onLog"],
  level: "info" | "success" | "error",
  message: string
) {
  onLog?.(level, message);
}

function extractEmailsFromText(text: string): string[] {
  const regex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const found = text.match(regex) || [];
  return Array.from(
    new Set(
      found.filter(
        (e) =>
          !e.includes("example") &&
          !e.includes("sentry") &&
          !e.includes("placeholder") &&
          !e.startsWith("your@") &&
          !e.match(/\.(png|jpg|gif|svg|webp|pdf)$/i) &&
          !e.includes("@2x") &&
          e.length < 80
      )
    )
  );
}

function generateGenericPatterns(domain: string): string[] {
  return [
    "contact", "info", "hello", "bonjour",
    "partenariat", "partenariats", "partnership",
    "marketing", "commercial", "pro", "b2b",
    "presse", "media", "communication", "direction",
    "redaction", "editor", "blog",
  ].map((p) => `${p}@${domain}`);
}

function applyHunterPattern(
  pattern: string,
  firstName: string,
  lastName: string,
  domain: string
): string | null {
  if (!pattern || !lastName) return null;
  const f = firstName?.charAt(0).toLowerCase() || "";
  const last = lastName.toLowerCase().replace(/\s+/g, "");
  const first = firstName?.toLowerCase().replace(/\s+/g, "") || "";
  return (
    pattern
      .replace("{first}", first)
      .replace("{last}", last)
      .replace("{f}", f)
      .replace("{l}", last.charAt(0)) + `@${domain}`
  );
}

// ── Jina AI scraper ────────────────────────────────────────────────────────────

async function fetchWithJina(url: string): Promise<string> {
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        Authorization: `Bearer ${process.env.JINA_API_KEY}`,
        Accept: "text/plain",
        "X-Return-Format": "markdown",
        "X-Timeout": "15",
      },
      signal: AbortSignal.timeout(18000),
    });
    if (!res.ok) return "";
    return await res.text();
  } catch {
    return "";
  }
}

// ── Hunter.io ──────────────────────────────────────────────────────────────────

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

    const contacts: FoundContact[] = emails.map((e) => ({
      name: [e.first_name, e.last_name].filter(Boolean).join(" ") || "—",
      role: e.position || e.type || "Contact",
      email: e.value,
      priority: priorityOf(e),
      source: "Hunter.io",
    }));

    return { emails: contacts.map((c) => c.email), contacts, pattern };
  } catch {
    return empty;
  }
}

// ── Snov.io ────────────────────────────────────────────────────────────────────

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

async function searchSnov(domain: string): Promise<{
  emails: string[];
  contacts: FoundContact[];
}> {
  const empty = { emails: [], contacts: [] };
  const token = await getSnovToken();
  if (!token) return empty;
  try {
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

    const contacts: FoundContact[] = emails.map((e) => ({
      name: [e.first_name, e.last_name].filter(Boolean).join(" ") || "—",
      role: e.position || "Contact",
      email: e.email,
      priority: priorityOf(e.position || ""),
      source: "Snov.io",
    }));

    return { emails: contacts.map((c) => c.email), contacts };
  } catch {
    return empty;
  }
}

// ── ZeroBounce ─────────────────────────────────────────────────────────────────

async function validateEmailsBatch(
  emails: string[]
): Promise<Map<string, ZBStatus>> {
  const map = new Map<string, ZBStatus>();
  if (!process.env.ZEROBOUNCE_API_KEY || !emails.length) return map;
  const toValidate = emails.slice(0, 10);
  try {
    const res = await fetch("https://api.zerobounce.net/v2/validatebatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.ZEROBOUNCE_API_KEY,
        email_batch: toValidate.map((email) => ({ email_address: email, ip_address: "" })),
      }),
    });
    if (!res.ok) return map;
    const data = await res.json();
    for (const r of (data.email_batch || []) as Array<{
      address: string;
      status: ZBStatus;
    }>) {
      map.set((r.address || "").toLowerCase(), r.status);
    }
  } catch {
    // non-blocking
  }
  return map;
}

// ── Main function ──────────────────────────────────────────────────────────────

export async function discoverEmails(
  domainOrUrl: string,
  options: EmailDiscoveryOptions = {}
): Promise<EmailDiscoveryResult> {
  const { onLog, context = "outreach SEO / backlink" } = options;

  // Normalize domain
  let domain: string;
  let baseUrl: string;
  try {
    const url = domainOrUrl.startsWith("http") ? domainOrUrl : `https://${domainOrUrl}`;
    const parsed = new URL(url);
    domain = parsed.hostname.replace(/^www\./, "");
    baseUrl = `${parsed.protocol}//${parsed.hostname}`;
  } catch {
    domain = domainOrUrl.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
    baseUrl = `https://${domain}`;
  }

  log(onLog, "info", `Démarrage email discovery pour ${domain}…`);

  // ── Phase 1 : Parallèle — Jina (12 pages) + Hunter + Snov ────────────────────

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
    Promise.all(jinaPages.map((url) => fetchWithJina(url))),
    (async () => {
      log(onLog, "info", `Hunter.io → ${domain}…`);
      const r = await searchHunter(domain);
      log(
        onLog,
        r.emails.length > 0 ? "success" : "info",
        `Hunter.io → ${r.emails.length} email(s)${r.pattern ? ` · pattern: ${r.pattern}` : ""}`
      );
      return r;
    })(),
    (async () => {
      log(onLog, "info", `Snov.io → ${domain}…`);
      const r = await searchSnov(domain);
      log(
        onLog,
        r.emails.length > 0 ? "success" : "info",
        `Snov.io → ${r.emails.length} email(s)`
      );
      return r;
    })(),
  ]);

  const successPages = jinaContents.filter((c) => c.length > 0).length;
  log(onLog, "info", `Jina → ${successPages}/${jinaPages.length} pages récupérées`);

  // ── Phase 2 : Regex + pattern ──────────────────────────────────────────────

  const fullJinaText = jinaContents.join("\n\n");
  const allRegexEmails = extractEmailsFromText(fullJinaText);
  const regexEmails = allRegexEmails.filter((e) => e.includes(domain));
  if (regexEmails.length > 0) {
    log(onLog, "info", `Regex → ${regexEmails.length} email(s) trouvé(s) dans le HTML`);
  }

  const patternEmails: string[] = [];
  if (hunterResult.pattern) {
    for (const contact of [...hunterResult.contacts, ...snovResult.contacts]) {
      const parts = contact.name.split(" ");
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ") || "";
      const generated = applyHunterPattern(
        hunterResult.pattern,
        firstName,
        lastName,
        domain
      );
      if (generated) patternEmails.push(generated);
    }
    if (patternEmails.length > 0) {
      log(
        onLog,
        "info",
        `Pattern (${hunterResult.pattern}) → ${patternEmails.length} email(s) généré(s)`
      );
    }
  }

  // ── Phase 3 : Merge & ZeroBounce ──────────────────────────────────────────

  const discovered = Array.from(
    new Set(
      [
        ...hunterResult.emails,
        ...snovResult.emails,
        ...regexEmails,
        ...patternEmails,
      ].map((e) => e.toLowerCase().trim())
    )
  );

  const genericPatterns = generateGenericPatterns(domain);
  const toValidate = Array.from(new Set([...discovered, ...genericPatterns])).slice(0, 10);

  log(onLog, "info", `${discovered.length} email(s) découverts — validation ZeroBounce…`);
  const zbMap = await validateEmailsBatch(toValidate);

  const validFound = Array.from(zbMap.entries())
    .filter(([, s]) => s === "valid" || s === "catch-all")
    .map(([e]) => e);
  const invalidFound = Array.from(zbMap.entries())
    .filter(([, s]) => s === "invalid" || s === "spamtrap" || s === "abuse")
    .map(([e]) => e);

  log(
    onLog,
    validFound.length > 0 ? "success" : "info",
    `ZeroBounce → ${validFound.length} valide(s) · ${invalidFound.length} invalide(s) · ${zbMap.size - validFound.length - invalidFound.length} inconnu(s)`
  );

  const finalEmails = Array.from(
    new Set(
      [
        ...validFound,
        ...discovered.filter((e) => !zbMap.has(e)),
      ].filter((e) => !invalidFound.includes(e))
    )
  );

  // ── Phase 4 : Groq consolidation & priorisation ────────────────────────────

  log(onLog, "info", "Groq → consolidation et priorisation finale…");

  const allContacts: FoundContact[] = [
    ...hunterResult.contacts,
    ...snovResult.contacts,
  ];

  const pageLabels = [
    "ACCUEIL", "CONTACT", "CONTACT-US", "À PROPOS", "ABOUT",
    "ABOUT-US", "ÉQUIPE", "TEAM", "PARTENARIATS", "PARTENARIAT", "PRESSE", "PRO",
  ];

  const jinaContext = jinaContents
    .map((c, i) => (c ? `=== ${pageLabels[i]} ===\n${c.substring(0, 600)}` : ""))
    .filter(Boolean)
    .join("\n\n")
    .substring(0, 3000);

  const zbSummary = Array.from(zbMap.entries())
    .map(([e, s]) => `${e}: ${s}`)
    .join(", ");

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const groqResponse = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: `Expert prospection B2B. Contexte: ${context}. Domaine cible: ${domain}

EMAILS DÉCOUVERTS:
${finalEmails.join(", ") || "aucun — utilise les patterns génériques si pertinents"}

CONTACTS (Hunter + Snov):
${allContacts.map((c) => `[${c.source}] ${c.name} · ${c.role} · ${c.email}`).join("\n") || "aucun"}

STATUTS ZEROBOUNCE:
${zbSummary || "non validés"}

CONTENU PAGES WEB:
${jinaContext}

Consolide, déduplique et classe par priorité :
partenariat > marketing > commercial > direction > générique > autre.
Inclus UNIQUEMENT les emails "valid", "catch-all" ou non vérifiés (JAMAIS "invalid", "spamtrap", "abuse").
Réponds UNIQUEMENT en JSON valide :
{"emails":["email@exemple.com"],"contacts":[{"name":"...","role":"...","email":"...","priority":1,"source":"..."}]}`,
      },
    ],
    temperature: 0.1,
    max_tokens: 1000,
  });

  interface EnrichResult {
    emails: string[];
    contacts: FoundContact[];
  }

  let result: EnrichResult = { emails: finalEmails, contacts: allContacts };
  try {
    const match = (groqResponse.choices[0]?.message?.content || "").match(/\{[\s\S]*\}/);
    if (match) result = JSON.parse(match[0]);
  } catch {
    log(onLog, "info", "Groq parsing échoué → fallback données brutes");
  }

  // Safety filter: remove explicitly invalid emails
  result.emails = Array.from(
    new Set(
      (result.emails || finalEmails)
        .map((e: string) => e.toLowerCase().trim())
        .filter((e: string) => !invalidFound.includes(e))
    )
  );

  // Best email = priority 1 contact, or first valid, or first overall
  const sortedContacts = (result.contacts || allContacts).sort(
    (a, b) => (a.priority || 99) - (b.priority || 99)
  );
  const bestEmail =
    sortedContacts[0]?.email ||
    validFound[0] ||
    result.emails[0] ||
    null;

  const zbStatuses: Record<string, ZBStatus> = Object.fromEntries(zbMap.entries());

  log(
    onLog,
    "success",
    `✅ Terminé — ${result.emails.length} email(s) · meilleur : ${bestEmail || "non trouvé"}`
  );

  return {
    emails: result.emails,
    contacts: result.contacts || allContacts,
    bestEmail,
    zbStatuses,
    sourceSummary: {
      hunter: hunterResult.emails.length,
      snov: snovResult.emails.length,
      regex: regexEmails.length,
      pattern: patternEmails.length,
      zbValid: validFound.length,
    },
  };
}
