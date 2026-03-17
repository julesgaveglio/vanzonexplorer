import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { createSupabaseAdmin } from "@/lib/supabase/server";

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
          content: `Tu rédiges un email de prise de contact B2B pour Vanzon Explorer (vanzonexplorer.com), une plateforme pour les passionnés de vanlife en France.

Destinataire : ${typedProspect.name}
Site : ${typedProspect.website}
Angle produit : ${categoryAngle}
Contexte marque : ${typedProspect.description || typedProspect.strategic_interest || "équipement van"}

Contenu site (pour personnalisation) :
${siteContent.substring(0, 2000)}

RÈGLES ABSOLUES :
- Email très court : 5 à 7 lignes maximum, pas plus
- Commence directement par une accroche liée à leurs produits spécifiques — jamais "Je me permets de..."
- Ne te présente pas comme "fondateur" ou avec un titre — signe juste avec un prénom
- Une seule proposition concrète : visibilité auprès d'une communauté de vanlifers acheteurs actifs, en échange d'un code promo exclusif membres
- Mentionne le lien https://www.vanzonexplorer.com/club uniquement si ça s'intègre naturellement
- Termine par une question ouverte simple pour générer une réponse
- Ton : direct, humain, naturel — pas commercial, pas corporate

STRUCTURE :
1. Accroche personnalisée sur leur produit (1 ligne)
2. Ce qu'on propose en 2 lignes max
3. Question de clôture (1 ligne)
4. Signature simple (prénom + Vanzon Explorer)

Format de réponse OBLIGATOIRE :
###OBJET###
[Objet court et spécifique, max 50 caractères]
###CORPS###
[Corps de l'email]
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
      subject = `Partenariat Vanzon Explorer × ${typedProspect.name}`;
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
