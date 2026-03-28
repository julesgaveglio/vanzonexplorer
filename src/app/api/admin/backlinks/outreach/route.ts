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
- Ce qu'on apporte à leur communauté (guides gratuits, conseils itinéraires Pays Basque)
- Proposition : partager un lien dans leur section ressources
- Ton décontracté, communautaire, pas commercial
- Signature Jules`,

  partenaire: `Tu rédiges un email de partenariat éditorial entre vanzonexplorer.com et un média / site de voyage / outdoor.
OBJECTIF : échange de liens ou articles invités dans un partenariat éditorial gagnant-gagnant.
STRUCTURE :
- Accroche sur leur positionnement éditorial avec un détail précis (1 phrase)
- Présentation Vanzon Explorer : location de vans aménagés au Pays Basque, blog spécialisé van life
- Proposition concrète : article invité sur leur site en échange d'un lien/mention
- Complémentarité audiences
- Signature Jules Gaveglio — Vanzon Explorer`,
};

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
    const templateInstructions = EMAIL_TEMPLATES[templateType];

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    // Build personalization context from discovered contacts
    const contactContext = discovery.contacts.slice(0, 3)
      .map((c) => `${c.name} (${c.role})`)
      .join(", ");

    const groqResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `${templateInstructions}

SITE CIBLE :
- Domaine : ${p.domain}
- URL page cible : ${p.url}
- Type : ${p.type}
- Score pertinence : ${p.score}/10
- Notes : ${p.notes || "—"}
${contactContext ? `- Contact(s) identifié(s) : ${contactContext}` : ""}
${discovery.bestEmail ? `- Email destinataire : ${discovery.bestEmail}` : ""}

CONTENU PAGE CIBLE :
${targetPageContent || "(non disponible)"}

RÈGLES ABSOLUES :
- Email court : 150-200 mots maximum
- Première phrase : mentionner un élément concret et spécifique du site
- Ne jamais inventer de chiffres ou statistiques
- Ne jamais écrire le mot "backlink" — dire "lien", "mention", "collaboration éditoriale"
- Ton humain, chaleureux, authentique
- Mentionner que vanzonexplorer.com est basé au Pays Basque
${contactContext ? `- Si possible, adresser l'email au contact identifié` : ""}
- Signer "Jules — Vanzon Explorer"

Format OBLIGATOIRE :
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
