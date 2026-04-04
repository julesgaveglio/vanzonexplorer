import { requireAdmin } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
}

interface MediaSeoAnalysis {
  alt: string;
  title: string;
  tags: string[];
}

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const { url } = await req.json() as { url?: string };
  if (!url) return Response.json({ error: "URL manquante" }, { status: 400 });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return Response.json({ error: "GEMINI_API_KEY manquante" }, { status: 500 });

  // Télécharger l'image depuis Sanity CDN
  const imageRes = await fetch(`${url}?auto=format&fit=max&w=1200&q=85`);
  if (!imageRes.ok) return Response.json({ error: "Impossible de télécharger l'image" }, { status: 400 });

  const contentType = imageRes.headers.get("content-type") ?? "image/webp";
  const buffer = Buffer.from(await imageRes.arrayBuffer());
  const base64 = buffer.toString("base64");

  const prompt = `Tu es expert SEO pour Vanzon Explorer, une activité de location de vans aménagés au Pays Basque (France).

Analyse cette photo et réponds UNIQUEMENT avec un JSON valide (pas de markdown, pas de balises) :
{
  "alt": "<texte alternatif SEO en français, 60-150 caractères, décrit précisément ce qu'on voit avec mots-clés vanlife/Pays Basque>",
  "title": "<slug kebab-case, 3-6 mots clés SEO pertinents séparés par des tirets, sans extension>",
  "tags": ["<tag1>", "<tag2>", "<tag3>", "<tag4>", "<tag5>"]
}

Règles pour les tags : 5 à 8 tags en français, mots-clés SEO courts (1-3 mots), pertinents pour le référencement vanlife/location van/Pays Basque.
Ne pas inclure "image de" ou "photo de" dans l'alt. Inclure "Vanzon Explorer" si l'image montre le van.`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: contentType, data: base64 } },
              { text: prompt },
            ],
          }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 400 },
        }),
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Gemini ${res.status}: ${errBody}`);
    }

    const data = (await res.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    // Extraire le JSON même s'il est encapsulé dans des blocs markdown
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Réponse Gemini sans JSON valide");
    const parsed = JSON.parse(jsonMatch[0]) as MediaSeoAnalysis;

    return Response.json({
      success: true,
      alt: String(parsed.alt ?? "").slice(0, 200),
      title: String(parsed.title ?? "").replace(/[^a-z0-9-]/g, "-").slice(0, 80),
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8).map(String) : [],
    });
  } catch (err) {
    console.error("[media/analyze]", err);
    return Response.json({ error: "Analyse IA échouée" }, { status: 500 });
  }
}
