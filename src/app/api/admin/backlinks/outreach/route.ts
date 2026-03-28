import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { createSupabaseAdmin } from "@/lib/supabase/server";

interface BacklinkProspect {
  id: string;
  domain: string;
  url: string;
  type: "blog" | "forum" | "partenaire" | "annuaire" | "media";
  score: number;
  notes: string;
}

interface EmailCandidate {
  email: string;
  confidence: number;
  source: "hunter" | "snov" | "scraped";
}

// ── Email Templates ────────────────────────────────────────────────────────────

const EMAIL_TEMPLATES: Record<string, string> = {
  blog: `Tu rédiges un email de demande de backlink pour vanzonexplorer.com vers un blogueur/créateur de contenu van life / road trip.
OBJECTIF : obtenir un lien naturel dans un de leurs articles existants ou une collaboration éditoriale.
STRUCTURE :
- Accroche ultra-personnalisée sur leur contenu spécifique (1 phrase avec un détail concret de leur site)
- Qui est Vanzon Explorer : location de vans aménagés au Pays Basque, blog et ressources vanlifers
- Proposition concrète : lien vers un de nos guides (vanzonexplorer.com/articles) dans un de leurs articles sur road trip / van life France
- Ouverture pour collaboration (article invité, mention, etc.)
- Signature Jules Gaveglio — Vanzon Explorer`,

  forum: `Tu rédiges un message de prise de contact pour un forum ou communauté van life / fourgon aménagé.
OBJECTIF : proposer nos ressources gratuites à la communauté, obtenir une mention ou un fil dédié.
STRUCTURE :
- Présentation courte et chaleureuse : Vanzon Explorer, location et ressources van life Pays Basque
- Ce qu'on apporte à leur communauté (guides gratuits, conseils itinéraires Pays Basque, partage d'expérience)
- Proposition : partager un lien dans leur section ressources
- Ton décontracté, communautaire, pas commercial du tout
- Signature Jules`,

  partenaire: `Tu rédiges un email de partenariat éditorial entre vanzonexplorer.com et un média / site de voyage / outdoor.
OBJECTIF : échange de liens ou articles invités dans un partenariat éditorial gagnant-gagnant.
STRUCTURE :
- Accroche sur leur positionnement éditorial avec un détail précis de leur contenu (1 phrase)
- Présentation Vanzon Explorer : location de vans aménagés au Pays Basque, blog spécialisé van life, audience qualifiée
- Proposition de partenariat concret : article invité sur leur site avec mention de nos services, backlink en échange
- Mettre en avant la complémentarité audiences
- Signature Jules Gaveglio — Vanzon Explorer`,
};

// ── Hunter.io email discovery ──────────────────────────────────────────────────

async function findEmailsHunter(domain: string): Promise<EmailCandidate[]> {
  if (!process.env.HUNTER_API_KEY) return [];
  try {
    const url = `https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${process.env.HUNTER_API_KEY}&limit=5&type=personal`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    const emails: { value: string; confidence: number }[] = data?.data?.emails || [];
    return emails
      .filter((e) => e.confidence >= 50)
      .map((e) => ({ email: e.value, confidence: e.confidence, source: "hunter" as const }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
  } catch {
    return [];
  }
}

// ── Snov.io email discovery ────────────────────────────────────────────────────

async function getSnovToken(): Promise<string | null> {
  try {
    const resp = await fetch("https://api.snov.io/v1/get-access-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.SNOV_CLIENT_ID,
        client_secret: process.env.SNOV_CLIENT_SECRET,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.access_token || null;
  } catch {
    return null;
  }
}

async function findEmailsSnov(domain: string): Promise<EmailCandidate[]> {
  if (!process.env.SNOV_CLIENT_ID || !process.env.SNOV_CLIENT_SECRET) return [];
  try {
    const token = await getSnovToken();
    if (!token) return [];

    const resp = await fetch("https://api.snov.io/v2/domain-emails-with-info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        access_token: token,
        domain,
        type: "all",
        limit: 5,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    const emails: { email: string; firstName?: string; lastName?: string }[] = data?.emails || [];
    return emails.slice(0, 3).map((e) => ({
      email: e.email,
      confidence: 70,
      source: "snov" as const,
    }));
  } catch {
    return [];
  }
}

// ── Jina scraping + regex extraction ──────────────────────────────────────────

async function scrapePageJina(url: string): Promise<string> {
  try {
    const resp = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        Authorization: `Bearer ${process.env.JINA_API_KEY}`,
        Accept: "text/plain",
        "X-Return-Format": "markdown",
        "X-Timeout": "12",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!resp.ok) return "";
    return (await resp.text()).substring(0, 4000);
  } catch {
    return "";
  }
}

function extractEmailsFromText(text: string): EmailCandidate[] {
  const regex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
  const found = Array.from(new Set(text.match(regex) || []));

  const SKIP_DOMAINS = ["example.com", "yourdomain.com", "gmail.com", "hotmail.com", "placeholder"];
  const PREFERRED_PREFIXES = ["contact", "hello", "bonjour", "info", "redaction", "presse", "editor", "blog"];

  return found
    .filter((email) => !SKIP_DOMAINS.some((d) => email.includes(d)))
    .map((email) => {
      const prefix = email.split("@")[0].toLowerCase();
      const score = PREFERRED_PREFIXES.some((p) => prefix.includes(p)) ? 60 : 40;
      return { email, confidence: score, source: "scraped" as const };
    })
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3);
}

// ── Main route ─────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { prospectId }: { prospectId: string } = body;

  if (!prospectId) {
    return Response.json({ success: false, error: "prospectId est requis" }, { status: 400 });
  }

  try {
    const supabase = createSupabaseAdmin();

    const { data: prospect, error: dbError } = await supabase
      .from("backlink_prospects")
      .select("*")
      .eq("id", prospectId)
      .single();

    if (dbError || !prospect) {
      return Response.json({ success: false, error: "Prospect introuvable" }, { status: 404 });
    }

    const p = prospect as BacklinkProspect;

    // ── 1. Email discovery ─────────────────────────────────────────────────────

    let emailCandidates: EmailCandidate[] = [];

    // Hunter.io (best source — confidence-scored)
    emailCandidates = await findEmailsHunter(p.domain);

    // Snov.io fallback
    if (emailCandidates.length === 0) {
      emailCandidates = await findEmailsSnov(p.domain);
    }

    // Jina scraping fallback — scrape /contact and homepage in parallel
    if (emailCandidates.length === 0) {
      const [homepageText, contactText] = await Promise.all([
        scrapePageJina(`https://${p.domain}`),
        scrapePageJina(`https://${p.domain}/contact`),
      ]);
      const combined = homepageText + "\n" + contactText;
      emailCandidates = extractEmailsFromText(combined);
    }

    const bestEmail = emailCandidates[0] || null;

    // ── 2. Scrape site for personalization ─────────────────────────────────────

    const siteContent = await scrapePageJina(`https://${p.domain}`);

    // ── 3. Generate email with Groq ────────────────────────────────────────────

    const templateType = (["blog", "forum", "partenaire"].includes(p.type)
      ? p.type
      : "blog") as "blog" | "forum" | "partenaire";
    const templateInstructions = EMAIL_TEMPLATES[templateType];

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const groqResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `${templateInstructions}

SITE CIBLE :
- Domaine : ${p.domain}
- URL cible : ${p.url}
- Type : ${p.type}
- Score pertinence : ${p.score}/10
- Notes : ${p.notes || "—"}

CONTENU DU SITE (pour personnalisation) :
${siteContent || "(contenu non disponible — utilise le domaine pour deviner le positionnement)"}

RÈGLES ABSOLUES :
- Email court : 150-200 mots maximum
- Première phrase : TOUJOURS mentionner un élément concret et spécifique du site (article, rubrique, sujet traité). Si le contenu est vide, deviner d'après le domaine.
- Ne jamais inventer de chiffres ou statistiques
- Ne jamais écrire le mot "backlink" — dire "lien", "mention", "référence"
- Ton humain, chaleureux, authentique — pas robotique
- Mentionner que vanzonexplorer.com est basé au Pays Basque
- Signer "Jules — Vanzon Explorer"

Format OBLIGATOIRE (respecte exactement ces délimiteurs) :
###OBJET###
[Objet : court, accrocheur, max 8 mots, personnalisé]
###CORPS###
[Corps complet de l'email en français]
###FIN###`,
        },
      ],
      temperature: 0.8,
      max_tokens: 800,
    });

    const rawContent = groqResponse.choices[0]?.message?.content || "";

    const subjectMatch = rawContent.match(/###OBJET###\s*([\s\S]*?)\s*###CORPS###/);
    const bodyMatch = rawContent.match(/###CORPS###\s*([\s\S]*?)\s*###FIN###/);

    let subject = subjectMatch?.[1]?.trim() ?? "";
    let emailBody = bodyMatch?.[1]?.trim() ?? "";

    if (!subject) subject = `Collaboration vanzonexplorer.com — ${p.domain}`;
    if (!emailBody) emailBody = rawContent.replace(/###\w+###/g, "").trim();

    // ── 4. Store draft in DB ───────────────────────────────────────────────────

    // Upsert: delete old draft for this prospect if exists
    await supabase.from("backlink_outreach").delete().eq("prospect_id", prospectId).eq("approved", false);

    const { data: outreach, error: insertError } = await supabase
      .from("backlink_outreach")
      .insert({
        prospect_id: prospectId,
        recipient_email: bestEmail?.email || null,
        email_subject: subject,
        email_body: emailBody,
        template_type: templateType,
        approved: false,
      })
      .select("id")
      .single();

    if (insertError) {
      return Response.json({ success: false, error: `Erreur insertion: ${insertError.message}` }, { status: 500 });
    }

    return Response.json({
      success: true,
      outreachId: outreach?.id,
      subject,
      body: emailBody,
      templateType,
      emailDiscovery: {
        found: !!bestEmail,
        email: bestEmail?.email || null,
        confidence: bestEmail?.confidence || null,
        source: bestEmail?.source || null,
        allCandidates: emailCandidates,
      },
      siteScraped: siteContent.length > 0,
    });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
