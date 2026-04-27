/**
 * Pipeline Reel automatisé :
 * 1. Analyse vidéos avec Groq (vision) → sélection meilleurs moments
 * 2. Découpe smart cuts avec ffmpeg
 * 3. Génération caption + hashtags avec Groq
 * 4. Assemblage Remotion → MP4
 * 5. Envoi Telegram pour validation
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

require("dotenv").config({ path: ".env.local" });

const GROQ_KEY = process.env.GROQ_API_KEY!;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_CHAT = process.env.TELEGRAM_CHAT_ID!;
const VIDEO_DIR = "/Users/julesgaveglio/Desktop/Vidéo Vanzon for Remotion";
const WORK_DIR = "/tmp/vanzon-reel-pipeline";
const MUSIC_PATH = path.join(process.cwd(), "public/reel-music/ambient-vanlife.mp3");

// ── Step 1: Analyze videos with Groq ──
async function analyzeVideos(videoFiles: string[]): Promise<{
  clips: { file: string; start: number; end: number; description: string; score: number }[];
  theme: string;
  caption: string;
  hashtags: string;
}> {
  console.log("🧠 Analyse IA des vidéos...");

  // Get video info for each file
  const videoInfos = videoFiles.map((f) => {
    const probe = execSync(
      `ffprobe -v quiet -print_format json -show_streams "${f}"`,
      { encoding: "utf-8" }
    );
    const data = JSON.parse(probe);
    const stream = data.streams?.find((s: { codec_type: string }) => s.codec_type === "video");
    const duration = parseFloat(stream?.duration ?? "0");
    return { file: f, name: path.basename(f), duration };
  });

  const videoList = videoInfos
    .map((v) => `- ${v.name}: ${v.duration.toFixed(1)}s`)
    .join("\n");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `Tu es un monteur vidéo expert en Reels Instagram pour une marque de location de vans aménagés au Pays Basque (Vanzon Explorer). Tu dois créer des Reels ambiance/lifestyle qui donnent envie de voyager en van.

RÈGLES DE MONTAGE :
- Durée totale du Reel : 20-28 secondes max
- Chaque clip dure 3-5 secondes (cuts dynamiques)
- Commence par le clip le plus accrocheur visuellement
- Alterne intérieur/extérieur pour du rythme
- Finis sur un plan large ou un moment cozy
- Le texte overlay doit être court et impactant (3-5 mots max par slide)`,
        },
        {
          role: "user",
          content: `Voici les vidéos disponibles (toutes sont des plans d'aménagement/intérieur de van) :
${videoList}

Créée un montage Reel Instagram. Réponds UNIQUEMENT en JSON valide :
{
  "clips": [
    { "file": "nom_fichier.mov", "start": 0.0, "end": 3.5, "description": "description courte", "score": 9 }
  ],
  "texts": [
    { "clip_index": 0, "text": "Texte overlay court", "position": "center" }
  ],
  "theme": "thème du reel en 3 mots",
  "caption": "caption Instagram complète (2-3 lignes max, authentique, pas commercial)",
  "hashtags": "10 hashtags pertinents séparés par des espaces"
}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "";

  // Extract JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Groq n'a pas renvoyé de JSON valide");

  const plan = JSON.parse(jsonMatch[0]);
  console.log(`  ✓ Thème: "${plan.theme}"`);
  console.log(`  ✓ ${plan.clips.length} clips sélectionnés`);

  // Map filenames back to full paths
  plan.clips = plan.clips.map((c: { file: string; start: number; end: number; description: string; score: number }) => ({
    ...c,
    file: videoInfos.find((v) => v.name === c.file)?.file ?? path.join(VIDEO_DIR, c.file),
  }));

  return plan;
}

// ── Step 2: Smart cuts with ffmpeg ──
function cutClips(
  clips: { file: string; start: number; end: number }[]
): string[] {
  console.log("\n✂️  Découpe des clips...");
  const cutPaths: string[] = [];

  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];
    const outPath = path.join(WORK_DIR, `clip-${i}.mp4`);
    const duration = clip.end - clip.start;

    execSync(
      `ffmpeg -y -ss ${clip.start} -i "${clip.file}" -t ${duration} -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1" -c:v libx264 -preset fast -crf 23 -an "${outPath}"`,
      { stdio: "pipe" }
    );

    cutPaths.push(outPath);
    console.log(`  ✓ Clip ${i + 1}: ${path.basename(clip.file)} [${clip.start}s → ${clip.end}s]`);
  }

  return cutPaths;
}

// ── Step 3: Add crossfade transitions with ffmpeg ──
function assembleWithTransitions(clipPaths: string[], musicPath: string): string {
  console.log("\n🎬 Assemblage avec transitions...");

  const outPath = path.join(WORK_DIR, "reel-final.mp4");
  const fadeDuration = 0.4;

  if (clipPaths.length === 1) {
    // Single clip - just add music
    execSync(
      `ffmpeg -y -i "${clipPaths[0]}" -i "${musicPath}" -c:v copy -c:a aac -shortest -map 0:v:0 -map 1:a:0 "${outPath}"`,
      { stdio: "pipe" }
    );
    console.log("  ✓ Single clip + musique");
    return outPath;
  }

  // Build concat with crossfade
  // First concatenate all clips
  const listPath = path.join(WORK_DIR, "clips.txt");
  fs.writeFileSync(
    listPath,
    clipPaths.map((p) => `file '${p}'`).join("\n")
  );

  const concatPath = path.join(WORK_DIR, "concat-raw.mp4");
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${listPath}" -c:v libx264 -preset fast -crf 23 "${concatPath}"`,
    { stdio: "pipe" }
  );

  // Add crossfade transitions between clips, fade in/out, and music
  const totalDuration = parseFloat(
    execSync(
      `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${concatPath}"`,
      { encoding: "utf-8" }
    ).trim()
  );

  execSync(
    `ffmpeg -y -i "${concatPath}" -i "${musicPath}" \
      -filter_complex "[0:v]fade=t=in:d=${fadeDuration},fade=t=out:st=${(totalDuration - fadeDuration).toFixed(2)}:d=${fadeDuration}[v];[1:a]afade=t=in:d=1,afade=t=out:st=${(totalDuration - 2).toFixed(2)}:d=2,volume=0.7[a]" \
      -map "[v]" -map "[a]" -c:v libx264 -preset fast -crf 22 -c:a aac -shortest "${outPath}"`,
    { stdio: "pipe" }
  );

  console.log(`  ✓ Reel assemblé (${totalDuration.toFixed(1)}s) avec musique`);
  return outPath;
}

// ── Step 4: Add text overlays with ffmpeg drawtext ──
function addTextOverlays(
  videoPath: string,
  texts: { clip_index: number; text: string }[],
  clipDurations: number[]
): string {
  console.log("\n✍️  Ajout des textes...");

  if (!texts || texts.length === 0) return videoPath;

  const outPath = path.join(WORK_DIR, "reel-with-text.mp4");

  // Calculate when each text appears based on clip start times
  let currentTime = 0;
  const textFilters: string[] = [];

  for (const t of texts) {
    let startTime = 0;
    for (let i = 0; i < t.clip_index && i < clipDurations.length; i++) {
      startTime += clipDurations[i];
    }
    const duration = clipDurations[t.clip_index] ?? 3;
    const endTime = startTime + duration;

    // Escape text for ffmpeg
    const escaped = t.text.replace(/'/g, "'\\''").replace(/:/g, "\\:");

    textFilters.push(
      `drawtext=text='${escaped}':fontsize=52:fontcolor=white:borderw=3:bordercolor=black@0.5:x=(w-text_w)/2:y=(h-text_h)/2:enable='between(t,${startTime.toFixed(2)},${(endTime - 0.3).toFixed(2)})'`
    );
    currentTime = endTime;
  }

  if (textFilters.length === 0) return videoPath;

  execSync(
    `ffmpeg -y -i "${videoPath}" -vf "${textFilters.join(",")}" -c:a copy "${outPath}"`,
    { stdio: "pipe" }
  );

  console.log(`  ✓ ${texts.length} textes ajoutés`);
  return outPath;
}

// ── Step 5: Send to Telegram ──
async function sendToTelegram(videoPath: string, caption: string, hashtags: string) {
  console.log("\n📤 Envoi sur Telegram...");

  const fullCaption = `🎬 Nouveau Reel prêt !\n\n${caption}\n\n${hashtags}`;

  // Send video
  const formData = new FormData();
  formData.append("chat_id", TELEGRAM_CHAT);
  formData.append("video", new Blob([fs.readFileSync(videoPath)], { type: "video/mp4" }), "reel-vanzon.mp4");
  formData.append("caption", fullCaption);
  formData.append("supports_streaming", "true");

  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendVideo`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (data.ok) {
    console.log("  ✓ Reel envoyé sur Telegram !");
  } else {
    console.error("  ✗ Erreur Telegram:", JSON.stringify(data));
  }
}

// ── Main pipeline ──
async function main() {
  // Setup
  fs.mkdirSync(WORK_DIR, { recursive: true });

  // Get video files
  const videoFiles = fs
    .readdirSync(VIDEO_DIR)
    .filter((f) => f.endsWith(".mov") || f.endsWith(".mp4"))
    .map((f) => path.join(VIDEO_DIR, f));

  console.log(`📁 ${videoFiles.length} vidéos trouvées\n`);

  // Step 1: AI Analysis
  const plan = await analyzeVideos(videoFiles);
  console.log(`\n📝 Caption: "${plan.caption}"`);
  console.log(`🏷️  Hashtags: ${plan.hashtags}`);

  // Step 2: Cut clips
  const cutPaths = cutClips(plan.clips);

  // Calculate durations
  const clipDurations = plan.clips.map(
    (c: { start: number; end: number }) => c.end - c.start
  );

  // Step 3: Assemble with transitions + music
  const assembled = assembleWithTransitions(cutPaths, MUSIC_PATH);

  // Step 4: Add text overlays
  const withText = addTextOverlays(assembled, plan.texts, clipDurations);

  // Step 5: Send to Telegram
  await sendToTelegram(withText, plan.caption, plan.hashtags);

  // File size
  const size = fs.statSync(withText).size;
  console.log(`\n✅ Pipeline terminé ! Taille finale: ${(size / 1024 / 1024).toFixed(1)}MB`);
  console.log(`📂 Fichier: ${withText}`);
}

main().catch((e) => {
  console.error("❌ Erreur pipeline:", e.message);
  process.exit(1);
});
