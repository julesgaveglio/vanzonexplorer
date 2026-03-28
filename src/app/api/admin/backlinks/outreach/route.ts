import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { discoverEmails } from "@/lib/email-discovery";

interface BacklinkProspect {
  id: string;
  domain: string;
  url: string;
  type: "blog" | "forum" | "partenaire" | "annuaire" | "media";
  score: number;
  notes: string;
}

// ── Prompt principal ───────────────────────────────────────────────────────────
// Un seul prompt, adapté au type via la variable ${type}

const OUTREACH_PROMPT = `Tu rédiges un email de prise de contact pour obtenir un backlink / mention vers vanzonexplorer.com.

EXEMPLE PARFAIT À IMITER (structure, ton, longueur) :
---
Bonjour E. Stierlen,

J'ai lu votre guide sur la van life en France — la partie itinéraires est particulièrement bien faite.

Je gère Vanzon Explorer, une plateforme van life basée au Pays Basque. On couvre des sujets que vous n'abordez peut-être pas encore : aménagement de van, homologation VASP, achat/revente, location — des angles qui pourraient compléter votre guide et apporter de la valeur à vos lecteurs.

Est-ce que vous seriez ouvert à une mention ou à un échange de contenu ?

Bonne journée,
Jules
---

RÈGLES STRICTES :
1. Salutation : "Bonjour [Prénom Initial. Nom]" si contact connu, sinon "Bonjour,"
2. Ligne 1 : 1 phrase qui montre que tu as LU leur contenu — cite quelque chose de SPÉCIFIQUE (article, rubrique, sujet). Jamais générique.
3. Ligne 2 : "Je gère Vanzon Explorer, une plateforme van life basée au Pays Basque." + 1 phrase sur ce qu'on couvre qui pourrait compléter LEUR contenu.
4. Ligne 3 : 1 question simple et directe — "Seriez-vous ouvert à une mention ?" ou "Est-ce qu'un échange de contenu vous intéresserait ?"
5. Signature : "Bonne journée,\nJules"
6. Maximum 5 phrases au total (hors salutation et signature)
7. AUCUN mot en gras, AUCUNE liste, AUCUN titre
8. Jamais le mot "backlink", "SEO", "lien entrant", "netlinking"
9. Ton : direct, humain, entre collègues — pas un commercial, pas un robot`;

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

    // ── 1. Email discovery — pipeline complet ──────────────────────────────────
    // Jina × 12 pages + Hunter.io + Snov.io + ZeroBounce + Groq consolidation

    const logs: string[] = [];
    const discovery = await discoverEmails(`https://${p.domain}`, {
      context: "outreach SEO backlink — blog / forum / site voyage van life France",
      onLog: (level, message) => {
        logs.push(`[${level}] ${message}`);
      },
    });

    // ── 2. Scrape homepage for email personalization (already in discovery) ────
    // On utilise le contenu Jina déjà récupéré pendant la discovery
    // On refait un scrape ciblé de la page cible pour personnalisation supplémentaire

    let targetPageContent = "";
    if (p.url && p.url !== `https://${p.domain}`) {
      try {
        const res = await fetch(`https://r.jina.ai/${p.url}`, {
          headers: {
            Authorization: `Bearer ${process.env.JINA_API_KEY}`,
            Accept: "text/plain",
            "X-Return-Format": "markdown",
            "X-Timeout": "12",
          },
          signal: AbortSignal.timeout(15000),
        });
        if (res.ok) targetPageContent = (await res.text()).substring(0, 2000);
      } catch { /* non-bloquant */ }
    }

    // ── 3. Generate personalized email with Groq ───────────────────────────────

    const templateType = (["blog", "forum", "partenaire"].includes(p.type)
      ? p.type
      : "blog") as "blog" | "forum" | "partenaire";

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Best contact name for salutation
    const bestContact = discovery.contacts.sort((a, b) => (a.priority || 99) - (b.priority || 99))[0];
    const contactName = bestContact?.name && bestContact.name !== "—" ? bestContact.name : null;
    const salutation = contactName
      ? (() => {
          const parts = contactName.trim().split(" ");
          if (parts.length >= 2) {
            return `${parts[0].charAt(0).toUpperCase()}. ${parts.slice(1).join(" ")}`;
          }
          return parts[0];
        })()
      : null;

    const groqResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `${OUTREACH_PROMPT}

SITE CIBLE :
- Domaine : ${p.domain}
- URL page cible : ${p.url}
- Type : ${p.type} (${templateType === "forum" ? "communauté / forum" : templateType === "partenaire" ? "média / site voyage" : "blog / créateur contenu"})
- Notes sur le site : ${p.notes || "—"}
${salutation ? "- Salutation : Bonjour " + salutation + "," : "- Pas de contact identifié — commencer par Bonjour,"}

CONTENU DU SITE (extrait) :
${targetPageContent || "(non disponible — imagine le contenu d'après le domaine et les notes)"}

Format OBLIGATOIRE :
###OBJET###
[Objet : 5-7 mots max, sans "RE:", sans emoji, naturel]
###CORPS###
[Email complet]
###FIN###`,
        },
      ],
      temperature: 0.75,
      max_tokens: 400,
    });

    const rawContent = groqResponse.choices[0]?.message?.content || "";
    const subjectMatch = rawContent.match(/###OBJET###\s*([\s\S]*?)\s*###CORPS###/);
    const bodyMatch = rawContent.match(/###CORPS###\s*([\s\S]*?)\s*###FIN###/);

    let subject = subjectMatch?.[1]?.trim() ?? "";
    let emailBody = bodyMatch?.[1]?.trim() ?? "";

    if (!subject) subject = `Collaboration vanzonexplorer.com — ${p.domain}`;
    if (!emailBody) emailBody = rawContent.replace(/###\w+###/g, "").trim();

    // ── 4. Store / upsert draft in DB ──────────────────────────────────────────

    await supabase
      .from("backlink_outreach")
      .delete()
      .eq("prospect_id", prospectId)
      .eq("approved", false);

    const { data: outreach, error: insertError } = await supabase
      .from("backlink_outreach")
      .insert({
        prospect_id: prospectId,
        recipient_email: discovery.bestEmail || null,
        email_subject: subject,
        email_body: emailBody,
        template_type: templateType,
        approved: false,
      })
      .select("id")
      .single();

    if (insertError) {
      return Response.json(
        { success: false, error: `Erreur insertion: ${insertError.message}` },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      outreachId: outreach?.id,
      subject,
      body: emailBody,
      templateType,
      emailDiscovery: {
        found: !!discovery.bestEmail,
        email: discovery.bestEmail,
        emails: discovery.emails,
        contacts: discovery.contacts,
        zbStatuses: discovery.zbStatuses,
        sourceSummary: discovery.sourceSummary,
        allCandidates: discovery.emails.map((e) => ({
          email: e,
          confidence: discovery.zbStatuses[e] === "valid" ? 95
            : discovery.zbStatuses[e] === "catch-all" ? 75
            : 50,
          source: discovery.contacts.find((c) => c.email === e)?.source || "scraped",
        })),
      },
      logs,
    });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
