/**
 * Script: Generate subtitles & chapters for VBA lessons
 * Usage: npx tsx scripts/vba-generate-captions.ts [moduleSlug]
 * Example: npx tsx scripts/vba-generate-captions.ts presentation
 * If no slug provided, lists all modules.
 */

import * as fs from "fs";
import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";

// Load .env.local
const envContent = fs.readFileSync(".env.local", "utf-8");
for (const line of envContent.split("\n")) {
  const [key, ...rest] = line.split("=");
  if (key && rest.length > 0 && !key.startsWith("#")) {
    process.env[key.trim()] = rest.join("=").trim();
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
// Rotate Groq API keys to avoid rate limits
const GROQ_KEYS = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
].filter(Boolean) as string[];
let groqKeyIndex = 0;
function getGroq(): Groq {
  const key = GROQ_KEYS[groqKeyIndex % GROQ_KEYS.length];
  return new Groq({ apiKey: key });
}
function rotateGroqKey() {
  groqKeyIndex++;
  console.log(`  🔄 Rotation clé Groq → clé #${(groqKeyIndex % GROQ_KEYS.length) + 1}`);
}

const BUNNY_API_KEY = process.env.BUNNY_API_KEY!;
const BUNNY_LIBRARY_ID = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID!;

// ─── Transcription ───────────────────────────────────────

interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

async function transcribeVideo(libraryId: string, videoId: string) {
  const CDN_HOST = "vz-3eab9985-c1f.b-cdn.net";
  const REFERER = { Referer: "https://iframe.mediadelivery.net/" };

  // Try resolutions from lowest to find one under 25MB (Groq limit)
  const resolutions = ["360p", "480p", "720p"];
  let videoBuffer: ArrayBuffer | null = null;
  let usedRes = "";

  for (const res of resolutions) {
    const mp4Url = `https://${CDN_HOST}/${videoId}/play_${res}.mp4`;
    console.log(`  📥 Téléchargement ${res}...`);
    const videoRes = await fetch(mp4Url, { headers: REFERER });
    if (!videoRes.ok) { console.log(`    → ${res} non dispo`); continue; }
    const buf = await videoRes.arrayBuffer();
    const sizeMB = buf.byteLength / 1024 / 1024;
    console.log(`    → ${sizeMB.toFixed(1)} MB`);
    if (sizeMB <= 24) {
      videoBuffer = buf;
      usedRes = res;
      break;
    }
    // If 360p is still too big, use it anyway (best we can do)
    if (res === "360p") {
      videoBuffer = buf;
      usedRes = res;
      console.log(`    ⚠️ Dépasse 25MB mais on tente quand même`);
      break;
    }
  }

  if (!videoBuffer) throw new Error("Aucune résolution téléchargeable");
  console.log(`  📦 Utilisation: ${usedRes} (${(videoBuffer.byteLength / 1024 / 1024).toFixed(1)} MB)`);
  const videoFile = new File([videoBuffer], "video.mp4", { type: "video/mp4" });

  console.log("  🎤 Transcription Whisper en cours...");
  let transcription;
  for (let attempt = 0; attempt < GROQ_KEYS.length; attempt++) {
    try {
      transcription = await getGroq().audio.transcriptions.create({
        file: videoFile,
        model: "whisper-large-v3-turbo",
        language: "fr",
        response_format: "verbose_json",
      });
      break;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("429") && attempt < GROQ_KEYS.length - 1) {
        rotateGroqKey();
        continue;
      }
      throw err;
    }
  }
  if (!transcription) throw new Error("All Groq keys rate-limited");

  const segments: TranscriptSegment[] = (
    (transcription as unknown as { segments?: Array<{ start: number; end: number; text: string }> }).segments ?? []
  ).map((s) => ({
    start: s.start,
    end: s.end,
    text: s.text.trim(),
  }));

  // Generate SRT
  const srt = segments
    .map((seg, i) => {
      const start = formatSRTTime(seg.start);
      const end = formatSRTTime(seg.end);
      return `${i + 1}\n${start} --> ${end}\n${seg.text}\n`;
    })
    .join("\n");

  console.log(`  ✅ Transcription: ${segments.length} segments, ${transcription.text.length} chars`);

  return { fullText: transcription.text, segments, srt };
}

function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")},${ms.toString().padStart(3, "0")}`;
}

// ─── Bunny Captions Upload ───────────────────────────────

async function uploadCaptionsToBunny(libraryId: string, videoId: string, srt: string) {
  console.log("  📤 Upload sous-titres sur Bunny...");
  const res = await fetch(
    `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}/captions/fr`,
    {
      method: "POST",
      headers: {
        AccessKey: BUNNY_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        srclang: "fr",
        label: "Français",
        captionsFile: Buffer.from(srt).toString("base64"),
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Bunny captions upload failed: ${res.status} — ${body}`);
  }
  console.log("  ✅ Sous-titres uploadés sur Bunny (CC activé)");
}

// ─── Chapter Generation ──────────────────────────────────

interface Chapter {
  title: string;
  time: number;
}

const CHAPTER_PROMPT = `Tu es un editeur video professionnel. A partir de cette transcription d'une video de formation sur le van amenage, identifie les changements de sujet majeurs et genere des chapitres.

Regles :
- Maximum 8 chapitres par video
- Minimum 2 minutes entre chaque chapitre
- Titres courts (3-6 mots), clairs, professionnels
- Le premier chapitre commence toujours a 0 secondes
- Ignore les digressions, blagues, hesitations — ne garde que les vrais changements de sujet
- Reponds UNIQUEMENT en JSON valide avec la cle "chapters" : {"chapters":[{"title":"...","time":0},...]}
- Si la video est courte (moins de 5 minutes), 2-3 chapitres suffisent`;

async function generateChapters(segments: TranscriptSegment[]): Promise<Chapter[]> {
  console.log("  🧠 Génération chapitres IA...");
  const timestamped = segments
    .map((s) => `[${Math.floor(s.start / 60)}:${Math.floor(s.start % 60).toString().padStart(2, "0")}] ${s.text}`)
    .join("\n");

  const completion = await getGroq().chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: CHAPTER_PROMPT },
      { role: "user", content: timestamped },
    ],
    temperature: 0.3,
    max_tokens: 1024,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content ?? "[]";

  try {
    const parsed = JSON.parse(raw);
    const chapters: Chapter[] = Array.isArray(parsed) ? parsed : parsed.chapters ?? [];
    const valid = chapters
      .filter((c) => typeof c.title === "string" && typeof c.time === "number" && c.time >= 0)
      .sort((a, b) => a.time - b.time);
    console.log(`  ✅ ${valid.length} chapitres générés`);
    return valid;
  } catch {
    console.log("  ⚠️ Parse error, fallback à Introduction");
    return [{ title: "Introduction", time: 0 }];
  }
}

// ─── Main ────────────────────────────────────────────────

async function main() {
  const moduleSlug = process.argv[2];

  if (!moduleSlug) {
    // List modules
    const { data: modules } = await supabase
      .from("vba_modules")
      .select("id, title, slug, order")
      .order("order");
    console.log("\n📚 Modules VBA disponibles:\n");
    for (const m of modules ?? []) {
      console.log(`  npx tsx scripts/vba-generate-captions.ts ${m.slug}`);
      console.log(`    → ${m.title}\n`);
    }
    return;
  }

  // Find module
  const { data: mod } = await supabase
    .from("vba_modules")
    .select("id, title, slug")
    .eq("slug", moduleSlug)
    .single();

  if (!mod) {
    console.error(`❌ Module "${moduleSlug}" introuvable`);
    return;
  }

  console.log(`\n🎬 Module: ${mod.title}\n`);

  // Get lessons with video
  const { data: lessons } = await supabase
    .from("vba_lessons")
    .select("id, title, slug, bunny_video_id, bunny_library_id, transcript")
    .eq("module_id", mod.id)
    .order("order");

  if (!lessons || lessons.length === 0) {
    console.log("Aucune leçon dans ce module.");
    return;
  }

  let processed = 0;
  let skipped = 0;

  for (const lesson of lessons) {
    console.log(`\n─── ${lesson.title} ───`);

    if (!lesson.bunny_video_id) {
      console.log("  ⏭️ Pas de vidéo Bunny — skip");
      skipped++;
      continue;
    }

    if (lesson.transcript) {
      console.log("  ⏭️ Déjà transcrit — skip (supprimez le transcript en DB pour régénérer)");
      skipped++;
      continue;
    }

    const libraryId = lesson.bunny_library_id || BUNNY_LIBRARY_ID;
    if (!libraryId) {
      console.log("  ⏭️ Pas de Library ID — skip");
      skipped++;
      continue;
    }

    try {
      // 1. Transcribe
      const result = await transcribeVideo(libraryId, lesson.bunny_video_id);

      // 2. Upload to Bunny
      await uploadCaptionsToBunny(libraryId, lesson.bunny_video_id, result.srt);

      // 3. Generate chapters
      const chapters = await generateChapters(result.segments);

      // 4. Save to Supabase
      console.log("  💾 Sauvegarde en base...");
      const { error } = await supabase
        .from("vba_lessons")
        .update({ transcript: result.fullText, chapters })
        .eq("id", lesson.id);

      if (error) throw new Error(`Supabase error: ${error.message}`);

      console.log("  ✅ Terminé !");
      for (const ch of chapters) {
        const m = Math.floor(ch.time / 60);
        const s = Math.floor(ch.time % 60);
        console.log(`     ${m}:${s.toString().padStart(2, "0")} — ${ch.title}`);
      }
      processed++;
    } catch (err) {
      console.error(`  ❌ Erreur: ${err instanceof Error ? err.message : err}`);
    }
  }

  console.log(`\n📊 Résultat: ${processed} traitées, ${skipped} skippées, ${lessons.length} total\n`);
}

main().catch(console.error);
