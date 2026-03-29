// Exporter les types pour que l'upload route puisse les importer sans redéclaration.
export interface VanImageAnalysis {
  alt: string;       // texte alternatif SEO (50-120 chars, français)
  caption: string;   // légende courte (max 80 chars)
  filename: string;  // slug kebab-case sans extension — utilisé comme title du mediaAsset Sanity
}

export interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
}

/**
 * Analyse une image WebP via Gemini 2.0 Flash Vision
 * et retourne les métadonnées SEO optimisées.
 * L'input est attendu post-Sharp (buffer WebP taille raisonnable).
 */
export async function analyzeVanImage(
  webpBuffer: Buffer,
  context: { vanName?: string; city?: string } = {}
): Promise<VanImageAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      alt: context.vanName ? `${context.vanName} — van aménagé Pays Basque` : "Van aménagé Pays Basque",
      caption: "Van aménagé Vanzon Explorer",
      filename: "van-amenage-pays-basque",
    };
  }

  const base64 = webpBuffer.toString("base64");
  const vanCtx = context.vanName ? `Le van s'appelle "${context.vanName}".` : "";
  const cityCtx = context.city ? `Région : ${context.city}.` : "Région : Pays Basque.";

  const prompt = `Tu es expert SEO pour une activité de location de vans aménagés. ${vanCtx} ${cityCtx}

Analyse cette photo et réponds UNIQUEMENT avec un JSON valide (pas de markdown, pas de balises) :
{
  "alt": "<texte alternatif SEO en français, 50-120 caractères, décrit précisément ce qu'on voit, inclut le contexte vanlife/Pays Basque>",
  "caption": "<légende courte en français, max 80 caractères, accrocheur>",
  "filename": "<slug kebab-case, 3-6 mots clés SEO séparés par des tirets, sans extension>"
}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: "image/webp", data: base64 } },
              { text: prompt },
            ],
          }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 256 },
        }),
      }
    );

    if (!res.ok) throw new Error(`Gemini ${res.status}`);

    const data = (await res.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned) as VanImageAnalysis;

    return {
      alt: String(parsed.alt || "").slice(0, 200),
      caption: String(parsed.caption || "").slice(0, 100),
      filename: String(parsed.filename || "van-amenage").replace(/[^a-z0-9-]/g, "-").slice(0, 80),
    };
  } catch (err) {
    console.warn("[imageAnalyzer] Gemini fallback:", err);
    return {
      alt: context.vanName ? `Intérieur ${context.vanName} — van aménagé Pays Basque` : "Van aménagé tout équipé Pays Basque",
      caption: "Van aménagé Vanzon Explorer",
      filename: "van-amenage-pays-basque",
    };
  }
}
