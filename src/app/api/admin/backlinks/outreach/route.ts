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

const EMAIL_TEMPLATES: Record<string, string> = {
  blog: `Tu rédiges un email de demande de backlink pour vanzonexplorer.com vers un blogueur/créateur de contenu spécialisé van life / road trip.

OBJECTIF : obtenir un lien naturel dans un de leurs articles existants, ou une mention/collaboration éditoriale.

STRUCTURE :
- Accroche personnalisée sur leur contenu (1 phrase)
- Qui est Vanzon Explorer (2 phrases max : location de vans aménagés au Pays Basque, blog et ressources pour vanlifers)
- Proposition concrète : un lien vers un de nos guides (ex: https://vanzonexplorer.com/articles) dans un de leurs articles existants sur le road trip / van life en France
- Ouverture pour une éventuelle collaboration (article invité, mention, etc.)
- Signature Jules`,

  forum: `Tu rédiges un message de prise de contact pour un forum ou communauté en ligne dédiée au van life / aménagement fourgon.

OBJECTIF : proposer de partager nos ressources (guides, articles) avec la communauté, obtenir une mention ou un fil dédié.

STRUCTURE :
- Présentation courte : Vanzon Explorer, location et ressources van life au Pays Basque
- Ce qu'on peut apporter à leur communauté (guides gratuits, conseils itinéraires Pays Basque)
- Proposition : partager un lien vers nos ressources dans leur section "ressources utiles" ou similaire
- Ton décontracté, communautaire, pas commercial
- Signature Jules`,

  partenaire: `Tu rédiges un email de partenariat éditorial entre vanzonexplorer.com et un média / site de voyage / outdoor.

OBJECTIF : échange de liens ou articles invités dans le cadre d'un partenariat éditorial mutuellement bénéfique.

STRUCTURE :
- Accroche sur leur positionnement éditorial (1 phrase)
- Présentation Vanzon Explorer : location de vans aménagés au Pays Basque, blog spécialisé van life
- Proposition de partenariat : article invité sur leur site avec mention de nos services, en échange d'une mention/lien sur le nôtre
- Mettre en avant la complémentarité (ex: vous couvrez le voyage, nous sommes experts van life Pays Basque)
- Signature Jules`,
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { prospectId }: { prospectId: string } = body;

  if (!prospectId) {
    return Response.json(
      { success: false, error: "prospectId est requis" },
      { status: 400 }
    );
  }

  try {
    const supabase = createSupabaseAdmin();

    // Fetch the prospect
    const { data: prospect, error: dbError } = await supabase
      .from("backlink_prospects")
      .select("*")
      .eq("id", prospectId)
      .single();

    if (dbError || !prospect) {
      return Response.json(
        { success: false, error: "Prospect introuvable" },
        { status: 404 }
      );
    }

    const p = prospect as BacklinkProspect;

    // Scrape homepage via Jina AI
    let siteContent = "";
    try {
      const homepageUrl = `https://${p.domain}`;
      const jinaResponse = await fetch(`https://r.jina.ai/${homepageUrl}`, {
        headers: {
          Authorization: `Bearer ${process.env.JINA_API_KEY}`,
          Accept: "text/plain",
          "X-Return-Format": "markdown",
          "X-Timeout": "12",
        },
        signal: AbortSignal.timeout(15000),
      });
      if (jinaResponse.ok) {
        const text = await jinaResponse.text();
        siteContent = text.substring(0, 2500);
      }
    } catch {
      // continue without site content
    }

    // Pick template based on type
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
- URL page cible : ${p.url}
- Type : ${p.type}
- Notes : ${p.notes}

CONTENU DU SITE (pour personnalisation) :
${siteContent || "(contenu non disponible)"}

RÈGLES :
- Email court (150-200 mots max)
- Ton naturel, humain, pas robotique
- Personnalise la première phrase grâce au contenu du site
- Mentionne explicitement leur domaine ou le nom de leur site si tu le trouves dans le contenu
- Ne mentionne pas de stats ou chiffres inventés
- Évite le mot "backlink" — parle de "lien", "mention", "collaboration éditoriale"

Format de réponse OBLIGATOIRE :
###OBJET###
[Objet de l'email, concis et personnalisé, 8 mots max]
###CORPS###
[Corps complet de l'email, en français]
###FIN###`,
        },
      ],
      temperature: 0.75,
      max_tokens: 700,
    });

    const rawContent = groqResponse.choices[0]?.message?.content || "";

    // Parse delimited format
    const subjectMatch = rawContent.match(/###OBJET###\s*([\s\S]*?)\s*###CORPS###/);
    const bodyMatch = rawContent.match(/###CORPS###\s*([\s\S]*?)\s*###FIN###/);

    let subject = subjectMatch?.[1]?.trim() ?? "";
    let emailBody = bodyMatch?.[1]?.trim() ?? "";

    // Fallback
    if (!subject) subject = `Collaboration vanzonexplorer.com × ${p.domain}`;
    if (!emailBody) emailBody = rawContent.replace(/###\w+###/g, "").trim();

    // Store draft in backlink_outreach (not approved yet)
    const { data: outreach, error: insertError } = await supabase
      .from("backlink_outreach")
      .insert({
        prospect_id: prospectId,
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
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
