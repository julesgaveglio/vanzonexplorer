import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

const CATEGORY_ANGLES: Record<string, string> = {
  énergie: "Autonomie électrique en van, lifestyle nomade",
  batteries: "Autonomie électrique en van, lifestyle nomade",
  froid: "Confort quotidien, conservation aliments en itinérance",
  chauffage: "Confort hiver, voyages 4 saisons",
  sanitaire: "Indépendance totale, séjours longue durée",
  distributeur: "Catalogue large, pertinence multi-produits pour membres",
  extérieur: "Extension de l'habitat, vie dehors",
  tendance: "Éco-responsabilité, autonomie eau",
  accessoires: "Optimisation de l'espace, confort au quotidien en van",
};

const DEFAULT_ANGLE = "Équipement van de qualité pour une communauté passionnée de vanlife";

interface Prospect {
  id: string;
  name: string;
  website: string;
  category?: string;
  description?: string;
  strategic_interest?: string;
}

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;
  const body = await req.json();
  const { prospectId }: { prospectId: string } = body;

  if (!prospectId) {
    return Response.json(
      { success: false, error: "prospectId est requis" },
      { status: 400 }
    );
  }

  try {
    const supabase = createSupabaseAdmin();

    // Fetch prospect from DB
    const { data: prospect, error: dbError } = await supabase
      .from("prospects")
      .select("*")
      .eq("id", prospectId)
      .single();

    if (dbError || !prospect) {
      return Response.json(
        { success: false, error: "Prospect introuvable" },
        { status: 404 }
      );
    }

    const typedProspect = prospect as Prospect;

    // Fetch homepage via Jina AI for product context (timeout 15s max)
    let siteContent = "";
    if (typedProspect.website) {
      try {
        const jinaResponse = await fetch(
          `https://r.jina.ai/${typedProspect.website}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.JINA_API_KEY}`,
              Accept: "text/plain",
              "X-Return-Format": "markdown",
              "X-Timeout": "12",
            },
            signal: AbortSignal.timeout(15000),
          }
        );
        if (jinaResponse.ok) {
          siteContent = await jinaResponse.text();
        }
      } catch {
        // continue without site content
      }
    }

    // Determine category angle
    const category = (typedProspect.category || "").toLowerCase();
    const categoryAngle =
      CATEGORY_ANGLES[category] ||
      Object.entries(CATEGORY_ANGLES).find(([key]) =>
        category.includes(key)
      )?.[1] ||
      DEFAULT_ANGLE;

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const groqResponse = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "user",
          content: `Tu rédiges un email de prise de contact partenariat pour Vanzon Explorer.

CONTEXTE MARQUE :
- Nom : ${typedProspect.name}
- Site : ${typedProspect.website}
- Catégorie : ${categoryAngle}
- Description : ${typedProspect.description || typedProspect.strategic_interest || "équipement van"}

CONTENU DU SITE (pour personnalisation de la phrase d'accroche) :
${siteContent.substring(0, 2000)}

L'email doit suivre EXACTEMENT cette structure — ne change que la phrase entre [ACCROCHE] :

---
Bonjour l'équipe ${typedProspect.name},

[ACCROCHE : 1 phrase ultra-personnalisée sur un produit ou aspect spécifique de leur marque, en lien avec le van/camping/outdoor. Exemple : "Vos réfrigérateurs BCD-35 correspondent parfaitement aux besoins de nos membres pour les longs trajets : fiables, silencieux et autonomes sur batterie."]

Vanzon Explorer est un écosystème vanlife basé au Pays basque, qui propose de la location, de l'achat et de la formation. Nous développons actuellement un club privé permettant à nos membres d'accéder à des réductions exclusives auprès de nos marques partenaires. Nous sélectionnons avec soin des produits testés et approuvés sur nos propres aménagements de vans.

Seriez-vous intéressés par une mise en avant de vos produits via un code promotionnel destiné à nos membres, actuellement en phase d'aménagement et avec une forte intention d'achat ?

Nous pourrions également envisager la rédaction d'une série d'articles de blog comparatifs intégrant vos produits, afin de valoriser votre site via des backlinks.

Si cette opportunité vous intéresse, je serais ravi d'en discuter avec vous.

Vous pouvez découvrir la plateforme ici :
https://www.vanzonexplorer.com/club

Jules
---

RÈGLES :
- Ne modifie RIEN d'autre que la phrase [ACCROCHE]
- L'accroche doit mentionner un produit ou une caractéristique réelle trouvée sur leur site
- Si tu ne trouves pas de produit spécifique, parle de leur positionnement ou leur marché
- Ton sobre, professionnel, humain

Format de réponse OBLIGATOIRE :
###OBJET###
[Objet au format exact : "Collaboration Vanzon Explorer × ${typedProspect.name}" — tu peux ajouter 2-3 mots max après le nom de marque si pertinent, jamais avant]
###CORPS###
[Corps complet de l'email]
###FIN###`,
        },
      ],
      temperature: 0.75,
      max_tokens: 800,
    });

    const rawContent = groqResponse.choices[0]?.message?.content || "";

    // Parse delimited format — much more robust than JSON for multi-line email bodies
    const subjectMatch = rawContent.match(/###OBJET###\s*([\s\S]*?)\s*###CORPS###/);
    const bodyMatch = rawContent.match(/###CORPS###\s*([\s\S]*?)\s*###FIN###/);

    let subject = subjectMatch?.[1]?.trim() ?? "";
    let body = bodyMatch?.[1]?.trim() ?? "";

    // Fallback: try JSON parsing if delimiters not found (Groq occasionally ignores format instructions)
    if (!subject || !body) {
      try {
        const jsonMatch = rawContent.match(/\{[\s\S]*?\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          subject = parsed.subject ?? subject;
          body = parsed.body ?? body;
        }
      } catch {
        // ignore
      }
    }

    // Last resort: extract from raw text
    if (!subject) {
      subject = `Collaboration Vanzon Explorer × ${typedProspect.name}`;
    }
    if (!body) {
      body = rawContent.replace(/###\w+###/g, "").trim();
    }

    const emailResult = { subject, body };

    if (!emailResult.subject || !emailResult.body) {
      return Response.json(
        {
          success: false,
          error: "Impossible de générer l'email (réponse Groq vide)",
          raw: rawContent.substring(0, 500),
        },
        { status: 500 }
      );
    }

    // Update prospect in DB
    await supabase
      .from("prospects")
      .update({
        generated_subject: emailResult.subject,
        generated_email: emailResult.body,
        status: "email_genere",
        updated_at: new Date().toISOString(),
      })
      .eq("id", prospectId);

    return Response.json({
      success: true,
      subject: emailResult.subject,
      body: emailResult.body,
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
