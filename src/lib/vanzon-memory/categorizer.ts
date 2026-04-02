// src/lib/vanzon-memory/categorizer.ts
// Appelle Groq pour catégoriser une transcription vocale et la formater en markdown.

import { groqWithFallback } from "@/lib/groq-with-fallback";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import type { CategorizerResult } from "./types";

const KNOWN_CATEGORIES = [
  { category: "vans",       description: "Maintenance, défauts, astuces techniques sur Yoni ou Xalbat", files: ["🚐 Yoni.md", "🚐 Xalbat.md"] },
  { category: "anecdotes",  description: "Moments marquants, histoires avec les locataires", files: [] },
  { category: "blog",       description: "Idées d'articles, angles, opinions tranchées à publier", files: ["✍️ Angles & Sujets Blog.md"] },
  { category: "equipe",     description: "Méthodes de travail, leçons collaboratives avec Jules ou Elio", files: ["👤 Jules.md", "👤 Elio.md"] },
  { category: "histoire",   description: "Milestones Vanzon, chronologie de l'entreprise", files: [] },
  { category: "territoire", description: "Spots, routes, recommandations Pays Basque", files: ["🗺️ Pays Basque.md"] },
  { category: "vision",     description: "Idées business, tarifs, modèle économique, valeurs, partenariats", files: ["💡 Business Model & Revenus.md"] },
];

/**
 * Récupère les catégories/fichiers déjà créés dynamiquement en Supabase.
 * Complète les catégories initiales connues.
 */
async function fetchExistingCategories(): Promise<{ category: string; obsidian_file: string }[]> {
  try {
    const supabase = createSupabaseAdmin();
    const { data } = await supabase
      .from("vanzon_memory")
      .select("category, obsidian_file")
      .order("created_at", { ascending: false });
    return data ?? [];
  } catch {
    return [];
  }
}

/**
 * Catégorise une transcription vocale et retourne la note formatée.
 * @param transcript  Texte brut de la transcription Whisper
 * @param correction  Optionnel — instruction de correction de Jules (flow Modifier)
 */
export async function categorizeMemory(
  transcript: string,
  correction?: string
): Promise<CategorizerResult> {
  const existing = await fetchExistingCategories();

  // Construire le contexte des fichiers existants (dédupliqués)
  const existingContext = existing.length > 0
    ? "\n\nFichiers déjà créés en mémoire :\n" +
      Array.from(new Map(existing.map(e => [e.obsidian_file, e])).values())
        .map(e => `- ${e.category}/${e.obsidian_file}`)
        .join("\n")
    : "";

  const knownContext = KNOWN_CATEGORIES
    .map(c => `- **${c.category}/** : ${c.description}${c.files.length ? ` (fichiers existants: ${c.files.join(", ")})` : ""}`)
    .join("\n");

  const today = new Date().toISOString().split("T")[0];

  const systemPrompt =
    `Tu es l'agent mémoire de Vanzon Explorer, une entreprise de location de vans aménagés au Pays Basque fondée par Jules Gaveglio et Elio.` +
    `\n\nTu reçois une transcription vocale et dois la catégoriser dans la base de connaissance Vanzon (dossiers Obsidian).` +
    `\n\nCatégories connues :\n${knownContext}${existingContext}` +
    `\n\nRègles :` +
    `\n- Choisis la catégorie la plus pertinente parmi celles connues` +
    `\n- Si le sujet est genuinement nouveau (ex: recettes, formation, partenaires), crée une nouvelle catégorie et un nouveau fichier` +
    `\n- obsidian_file = nom du fichier seul dans la catégorie, ex: "🚐 Yoni.md" (conserve les emojis des fichiers existants)` +
    `\n- Pour un nouveau fichier, choisis un nom clair sans emoji (sauf si cohérent avec la convention existante)` +
    `\n- content = note formatée en markdown, 2-4 phrases concises, à la troisième personne ou impersonnelle` +
    `\n- tags = 2-4 mots-clés en minuscule sans #` +
    `\n- title = titre court en français (5-8 mots max)` +
    `\n- La date du jour est : ${today}` +
    `\n\nRéponds UNIQUEMENT avec un JSON valide, aucun texte autour.`;

  const userPrompt = correction
    ? `Transcription originale : "${transcript}"\n\nInstruction de correction : "${correction}"\n\nGénère le JSON mis à jour.`
    : `Transcription : "${transcript}"\n\nGénère le JSON de catégorisation.`;

  const { content: raw } = await groqWithFallback({
    model:           "llama-3.3-70b-versatile",
    response_format: { type: "json_object" },
    temperature:     0.3,
    max_tokens:      500,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userPrompt },
    ],
  });
  const parsed = JSON.parse(raw) as {
    category?:      string;
    obsidian_file?: string;
    title?:         string;
    content?:       string;
    tags?:          string[];
  };

  return {
    category:      parsed.category      ?? "vision",
    obsidian_file: parsed.obsidian_file ?? "notes.md",
    title:         parsed.title         ?? "Note sans titre",
    content:       parsed.content       ?? transcript,
    tags:          Array.isArray(parsed.tags) ? parsed.tags : [],
  };
}
