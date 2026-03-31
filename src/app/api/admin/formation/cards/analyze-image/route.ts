import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { adminWriteClient } from "@/lib/sanity/adminClient";
import { auth, currentUser } from "@clerk/nextjs/server";

const ALLOWED_EMAIL = "gavegliojules@gmail.com";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  if (user?.emailAddresses?.[0]?.emailAddress !== ALLOWED_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile || imageFile.size === 0) {
      return NextResponse.json({ error: "Image manquante" }, { status: 400 });
    }

    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const base64 = buffer.toString("base64");
    const ext = (imageFile.name.split(".").pop() ?? "jpg").toLowerCase();
    const mimeMap: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      gif: "image/gif",
    };
    const mediaType = (mimeMap[ext] ?? "image/jpeg") as
      | "image/jpeg"
      | "image/png"
      | "image/webp"
      | "image/gif";

    // ── Analyse avec Claude Vision ───────────────────────────────────────────
    const aiResponse = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 400,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: `Tu es expert SEO pour Vanzon Explorer (vanzonexplorer.com) — location de vans aménagés et formation van life, basé au Pays Basque, France.

Analyse cette image et génère des métadonnées SEO optimisées en français.

Consignes strictes :
- title : titre SEO précis et naturel (50 caractères max). Intègre le contexte van/formation/vanlife si vraiment pertinent. Ex : "Aménagement cuisine van Vanzon Explorer"
- alt : texte alternatif descriptif et accessible (120 caractères max). Commence par le sujet principal de l'image. Ex : "Intérieur d'un van aménagé avec cuisine en bois et plan de travail, formation Vanzon Explorer"
- filename : nom de fichier kebab-case, 4 à 6 mots clés SEO, sans extension. Ex : "amenagement-cuisine-van-bois-formation-vanzon"

Réponds UNIQUEMENT avec un JSON valide, rien d'autre :
{"title":"...","alt":"...","filename":"..."}`,
            },
          ],
        },
      ],
    });

    const rawText =
      aiResponse.content[0].type === "text" ? aiResponse.content[0].text.trim() : "";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Réponse IA invalide");

    const meta = JSON.parse(jsonMatch[0]) as {
      title: string;
      alt: string;
      filename: string;
    };

    // ── Upload vers Sanity avec nom SEO ───────────────────────────────────────
    const asset = await adminWriteClient.assets.upload("image", buffer, {
      filename: `${meta.filename}.${ext}`,
      contentType: mediaType,
    });

    // ── Créer le document mediaAsset (médiathèque Vanzon) ────────────────────
    await adminWriteClient.create({
      _type: "mediaAsset",
      title: meta.title,
      category: "formation",
      image: {
        _type: "image",
        asset: { _type: "reference", _ref: asset._id },
        alt: meta.alt,
      },
      usedIn: "Cartes Formation",
    });

    return NextResponse.json({
      success: true,
      assetId: asset._id,
      url: `${asset.url}?auto=format&fit=max&q=82`,
      alt: meta.alt,
      title: meta.title,
      filename: meta.filename,
    });
  } catch (err) {
    console.error("[Formation Cards ANALYZE IMAGE]", err);
    return NextResponse.json({ error: "Erreur lors de l'analyse" }, { status: 500 });
  }
}
