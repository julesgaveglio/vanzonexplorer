import { createHmac } from "crypto";
import { adminWriteClient } from "@/lib/sanity/adminClient";

interface SanityWebhookPayload {
  _id: string;
  title?: string;
  alt?: string;
  tags?: string[];
  imageUrl?: string; // projection: image.asset->url
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
}

interface SeoMeta {
  alt?: string;
  title?: string;
  tags?: string[];
}

function verifySignature(rawBody: string, header: string, secret: string): boolean {
  const parts: Record<string, string> = {};
  for (const segment of header.split(",")) {
    const idx = segment.indexOf("=");
    if (idx !== -1) parts[segment.slice(0, idx)] = segment.slice(idx + 1);
  }
  const { t: timestamp, v1: signature } = parts;
  if (!timestamp || !signature) return false;

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  return expected === signature;
}

async function analyzeImageUrl(imageUrl: string, apiKey: string): Promise<SeoMeta> {
  const imageRes = await fetch(`${imageUrl}?auto=format&fit=max&w=1200&q=85`);
  if (!imageRes.ok) throw new Error(`Impossible de télécharger l'image: ${imageRes.status}`);

  const contentType = imageRes.headers.get("content-type") ?? "image/webp";
  const buffer = Buffer.from(await imageRes.arrayBuffer());
  const base64 = buffer.toString("base64");

  const prompt = `Tu es expert SEO pour Vanzon Explorer, location de vans aménagés au Pays Basque (France).

Analyse cette photo et réponds UNIQUEMENT avec un JSON valide (pas de markdown) :
{
  "alt": "<texte alternatif SEO en français, 60-150 caractères, décrit précisément ce qu'on voit, inclut vanlife/Pays Basque>",
  "title": "<slug kebab-case, 3-6 mots clés SEO séparés par des tirets, sans extension>",
  "tags": ["<tag1>", "<tag2>", "<tag3>", "<tag4>", "<tag5>"]
}

Règles : 5 à 8 tags en français, mots-clés courts (1-3 mots). Pas de "image de" ou "photo de" dans l'alt. Inclure "Vanzon Explorer" si le van est visible.`;

  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [
          { inline_data: { mime_type: contentType, data: base64 } },
          { text: prompt },
        ]}],
        generationConfig: { temperature: 0.3, maxOutputTokens: 400 },
      }),
    }
  );

  if (!geminiRes.ok) {
    const errBody = await geminiRes.text();
    throw new Error(`Gemini ${geminiRes.status}: ${errBody}`);
  }

  const data = (await geminiRes.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Aucun JSON dans la réponse Gemini");

  return JSON.parse(jsonMatch[0]) as SeoMeta;
}

export async function POST(req: Request) {
  const rawBody = await req.text();

  // Vérification signature Sanity
  const secret = process.env.SANITY_WEBHOOK_SECRET;
  if (secret) {
    const sigHeader = req.headers.get("sanity-webhook-signature") ?? "";
    if (!verifySignature(rawBody, sigHeader, secret)) {
      console.warn("[webhook/sanity-media] Signature invalide");
      return Response.json({ error: "Signature invalide" }, { status: 401 });
    }
  }

  let payload: SanityWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as SanityWebhookPayload;
  } catch {
    return Response.json({ error: "Payload invalide" }, { status: 400 });
  }

  // Skip si pas d'image
  if (!payload.imageUrl) {
    return Response.json({ skipped: true, reason: "pas d'URL image" });
  }

  // Skip si déjà bien renseigné (alt >= 20 chars = déjà analysé)
  if (payload.alt && payload.alt.length >= 20) {
    return Response.json({ skipped: true, reason: "alt déjà renseigné", id: payload._id });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "GEMINI_API_KEY manquante" }, { status: 500 });
  }

  try {
    const meta = await analyzeImageUrl(payload.imageUrl, apiKey);

    const patch = adminWriteClient.patch(payload._id);
    if (meta.alt) patch.set({ "image.alt": String(meta.alt).slice(0, 200) });
    if (meta.title && (!payload.title || payload.title.length < 5)) {
      patch.set({ title: String(meta.title).replace(/[^a-z0-9-]/g, "-").slice(0, 80) });
    }
    if (meta.tags?.length) patch.set({ tags: meta.tags.slice(0, 8).map(String) });

    await patch.commit();

    console.log(`[webhook/sanity-media] ✅ ${payload._id} → alt="${meta.alt?.slice(0, 50)}..."`);
    return Response.json({ success: true, id: payload._id });
  } catch (err) {
    console.error("[webhook/sanity-media]", err);
    // Renvoyer 500 pour que Sanity retente automatiquement
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
