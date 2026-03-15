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
          content: `Tu es le fondateur de Vanzon Explorer (vanzonexplorer.com), plateforme communautaire pour les passionnés de vanlife en France. Tu écris un email de prospection professionnel, humain et ultra-personnalisé à ${typedProspect.name} pour proposer un partenariat Club Privé.

Angle catégorie: ${categoryAngle}

Informations sur la marque:
- Site: ${typedProspect.website}
- Description: ${typedProspect.description || "à enrichir"}
- Intérêt stratégique: ${typedProspect.strategic_interest || "partenariat équipement van"}

Contenu du site web:
${siteContent.substring(0, 3000)}

Génère:
1. Un objet d'email accrocheur et personnalisé (max 60 chars)
2. Un corps d'email (300-400 mots) qui:
   - Présente Vanzon Explorer et le Club Privé brièvement
   - Mentionne un aspect SPÉCIFIQUE des produits/services de la marque (utilise le contenu du site)
   - Propose clairement: code exclusif membres + article blog comparatif avec backlink SEO
   - Précise que la communauté a une forte intention d'achat équipement van
   - Lien Club: https://www.vanzonexplorer.com/club
   - Ton: professionnel, humain, direct, crédible

IMPORTANT — Format de réponse OBLIGATOIRE (respecte exactement ces balises) :
###OBJET###
[L'objet de l'email sur une seule ligne]
###CORPS###
[Le corps complet de l'email]
###FIN###`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
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
