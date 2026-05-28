/**
 * YouTube Shorts Editor Agent
 *
 * Prend une vidéo face-cam brute (1-3 min) et produit un YouTube Short (<60s)
 * avec suppression des silences, validation QC par Claude, sous-titres animés
 * style CapCut, et musique de fond.
 *
 * Pipeline : auto-editor → whisper → Claude QC → FFmpeg cuts → pycaps subtitles → FFmpeg export → Telegram
 *
 * Usage : npx tsx scripts/agents/shorts-editor-agent.ts /path/to/video.mp4
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { notifyTelegram } from "../lib/telegram";
import { startRun, finishRun } from "../lib/agent-runs";
import { createCostTracker, type CostTracker } from "../lib/ai-costs";

require("dotenv").config({ path: ".env.local" });

// ── Constants ──

const WORK_DIR = "/tmp/vanzon-shorts-editor";
const MUSIC_DIR = path.join(process.cwd(), "public/reel-music");
const BURN_SUBTITLES_SCRIPT = path.join(__dirname, "shorts-editor/burn_subtitles.py");

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_CHAT = process.env.TELEGRAM_CHAT_ID!;

// ── Types ──

interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

interface TranscriptSegment {
  id: number;
  text: string;
  start: number;
  end: number;
  words: WordTimestamp[];
}

interface QCResult {
  hookSegmentId: number;
  segmentsToRemove: number[];
  segmentsToKeep: number[];
  removalReasons: Record<string, string>;
  estimatedDuration: number;
  finalTranscript: string;
  suggestedCta: string;
  qualityScore: number;
}

// ── Helpers ──

function getDuration(videoPath: string): number {
  const raw = execSync(
    `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${videoPath}"`,
    { encoding: "utf-8" }
  ).trim();
  return parseFloat(raw);
}

function findMusic(): string | null {
  if (!fs.existsSync(MUSIC_DIR)) return null;

  // Check subdirectories for MP3s
  const subdirs = ["upbeat", "adventure", "chill", "cinematic", "nature"];
  for (const sub of subdirs) {
    const dir = path.join(MUSIC_DIR, sub);
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter(f => f.endsWith(".mp3"));
    // Validate file size (>50KB to avoid corrupt files)
    const valid = files.filter(f => fs.statSync(path.join(dir, f)).size > 50_000);
    if (valid.length > 0) {
      return path.join(dir, valid[Math.floor(Math.random() * valid.length)]);
    }
  }

  // Fallback: loose MP3s in root music dir
  const rootFiles = fs.readdirSync(MUSIC_DIR)
    .filter(f => f.endsWith(".mp3"))
    .filter(f => fs.statSync(path.join(MUSIC_DIR, f)).size > 50_000);

  if (rootFiles.length > 0) {
    return path.join(MUSIC_DIR, rootFiles[Math.floor(Math.random() * rootFiles.length)]);
  }

  return null;
}

// ── Step 0: Preprocess (4K/HEVC/HDR → 1080p H.264 SDR) ──

function preprocessIfNeeded(inputPath: string): string {
  const probeRaw = execSync(
    `ffprobe -v quiet -print_format json -show_streams "${inputPath}"`,
    { encoding: "utf-8" }
  );
  const streams = JSON.parse(probeRaw);
  const video = streams.streams?.find((s: any) => s.codec_type === "video");

  if (!video) return inputPath;

  const codec = video.codec_name || "";
  const width = video.width || 0;
  const height = video.height || 0;
  const colorTransfer = video.color_transfer || "";
  const is4K = width > 1920 || height > 1920;
  const isHEVC = codec === "hevc" || codec === "h265";

  // Skip if already H.264 at 1080p (even if HDR metadata lingers)
  if (!is4K && !isHEVC) return inputPath;

  console.log("\n[0/7] 🔄 Préprocessing (4K/HEVC/HDR → 1080p H.264)...");
  console.log(`  Source: ${width}x${height} ${codec} ${isHDR ? "HDR" : "SDR"}`);

  const output = path.join(WORK_DIR, "00-preprocessed.mp4");

  // Scale to 1080x1920 (portrait) or 1920x1080 (landscape) depending on aspect
  const isPortrait = height > width;
  const scaleTarget = isPortrait ? "1080:1920" : "1920:1080";

  execSync(
    `ffmpeg -y -i "${inputPath}" ` +
    `-vf "scale=${scaleTarget}:force_original_aspect_ratio=increase,crop=${scaleTarget},format=yuv420p" ` +
    `-colorspace bt709 -color_primaries bt709 -color_trc bt709 ` +
    `-c:v libx264 -preset fast -crf 22 ` +
    `-c:a aac -b:a 128k ` +
    `-r 30 ` +
    `"${output}"`,
    { stdio: "pipe", timeout: 600_000 }
  );

  const origSize = fs.statSync(inputPath).size;
  const newSize = fs.statSync(output).size;
  console.log(`  ✓ ${(origSize / 1024 / 1024).toFixed(0)}MB → ${(newSize / 1024 / 1024).toFixed(0)}MB`);

  return output;
}

// ── Step 1: Remove silences ──
// Uses ffmpeg silencedetect (audio analysis only, ~5s) instead of auto-editor (re-encodes, ~18min on 4K)

interface SilencePeriod {
  start: number;
  end: number;
  duration: number;
}

function detectSilences(inputPath: string): SilencePeriod[] {
  const raw = execSync(
    `ffmpeg -i "${inputPath}" -af "silencedetect=n=-30dB:d=0.3" -f null - 2>&1`,
    { encoding: "utf-8", timeout: 60_000 }
  );

  const silences: SilencePeriod[] = [];
  const lines = raw.split("\n");
  let currentStart: number | null = null;

  for (const line of lines) {
    const startMatch = line.match(/silence_start:\s*([\d.]+)/);
    const endMatch = line.match(/silence_end:\s*([\d.]+)\s*\|\s*silence_duration:\s*([\d.]+)/);

    if (startMatch) {
      currentStart = parseFloat(startMatch[1]);
    }
    if (endMatch && currentStart !== null) {
      silences.push({
        start: currentStart,
        end: parseFloat(endMatch[1]),
        duration: parseFloat(endMatch[2]),
      });
      currentStart = null;
    }
  }

  return silences;
}

function removeSilences(inputPath: string): string {
  console.log("\n[1/7] 🔇 Suppression des silences...");

  const totalDuration = getDuration(inputPath);
  const silences = detectSilences(inputPath);
  console.log(`  ✓ ${silences.length} silences détectés`);

  if (silences.length === 0) {
    console.log("  ✓ Pas de silences significatifs, vidéo conservée telle quelle");
    return inputPath;
  }

  // Build speech segments (inverse of silence periods) with 0.15s margin
  const margin = 0.15;
  const speechSegments: { start: number; end: number }[] = [];
  let cursor = 0;

  for (const silence of silences) {
    const speechEnd = Math.max(silence.start + margin, cursor);
    if (speechEnd > cursor + 0.1) { // min 100ms speech segment
      speechSegments.push({ start: cursor, end: speechEnd });
    }
    cursor = Math.max(silence.end - margin, 0);
  }

  // Add final segment
  if (cursor < totalDuration - 0.1) {
    speechSegments.push({ start: cursor, end: totalDuration });
  }

  // Extract and concat speech segments
  const segPaths: string[] = [];
  for (let i = 0; i < speechSegments.length; i++) {
    const seg = speechSegments[i];
    const dur = seg.end - seg.start;
    const segPath = path.join(WORK_DIR, `speech-${i}.mp4`);

    execSync(
      `ffmpeg -y -ss ${seg.start.toFixed(3)} -i "${inputPath}" -t ${dur.toFixed(3)} ` +
      `-af "afade=t=in:st=0:d=0.03,afade=t=out:st=${Math.max(dur - 0.03, 0).toFixed(3)}:d=0.03" ` +
      `-c:v libx264 -preset fast -crf 22 -c:a aac -b:a 128k "${segPath}"`,
      { stdio: "pipe", timeout: 30_000 }
    );

    segPaths.push(segPath);
  }

  // Concat all speech segments
  const output = path.join(WORK_DIR, "01-no-silence.mp4");
  const concatList = path.join(WORK_DIR, "speech-concat.txt");
  fs.writeFileSync(concatList, segPaths.map(p => `file '${p}'`).join("\n"));

  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatList}" -c copy "${output}"`,
    { stdio: "pipe", timeout: 30_000 }
  );

  // Cleanup speech segments
  for (const p of segPaths) {
    try { fs.unlinkSync(p); } catch {}
  }
  try { fs.unlinkSync(concatList); } catch {}

  const newDur = getDuration(output);
  console.log(`  ✓ ${totalDuration.toFixed(1)}s → ${newDur.toFixed(1)}s (${((1 - newDur / totalDuration) * 100).toFixed(0)}% supprimé)`);

  return output;
}

// ── Step 2: Transcribe ──

function transcribeVideo(videoPath: string): { segments: TranscriptSegment[]; whisperJsonPath: string } {
  console.log("\n[2/7] 🎤 Transcription whisper...");

  execSync(
    `whisper "${videoPath}" --model turbo --language fr --word_timestamps True --output_format json --output_dir "${WORK_DIR}" --initial_prompt "Bonjour, je suis Jules de Vanzon Explorer. Formation VBA, van aménagé, business."`,
    { stdio: "inherit", timeout: 600_000 }
  );

  // Whisper outputs with the same basename as input
  const basename = path.basename(videoPath, path.extname(videoPath));
  const jsonPath = path.join(WORK_DIR, `${basename}.json`);

  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Whisper n'a pas produit de JSON: ${jsonPath}`);
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  const segments: TranscriptSegment[] = (data.segments || []).map((seg: any) => ({
    id: seg.id,
    text: seg.text?.trim() || "",
    start: seg.start,
    end: seg.end,
    words: (seg.words || [])
      .filter((w: any) => w.start !== undefined && w.end !== undefined)
      .map((w: any) => ({
        word: w.word,
        start: w.start,
        end: w.end,
      })),
  }));

  if (segments.length === 0) {
    throw new Error("Transcription vide — la vidéo n'a peut-être pas d'audio ?");
  }

  const totalWords = segments.reduce((sum, s) => sum + s.words.length, 0);
  console.log(`  ✓ ${segments.length} segments, ${totalWords} mots détectés`);

  return { segments, whisperJsonPath: jsonPath };
}

// ── Step 3: QC Validation via Claude ──

async function qcValidation(
  segments: TranscriptSegment[],
  totalDuration: number,
  costTracker: CostTracker
): Promise<QCResult> {
  console.log("\n[3/7] 🧠 Validation QC via Claude...");

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const segmentsList = segments
    .map(s => `[Segment ${s.id}] (${s.start.toFixed(1)}s → ${s.end.toFixed(1)}s) : "${s.text}"`)
    .join("\n");

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    system: `Tu es un monteur YouTube Shorts expert en contenu business/vanlife francophone.

CONTEXTE : Jules (entrepreneur) filme des face-cam selfie pour promouvoir sa formation VBA (Van Business Academy). Chaque Short doit être percutant, clair, et positionner Jules comme expert.

TA MISSION : Analyser la transcription d'une vidéo post-silence-removal et décider quoi garder.

RÈGLES STRICTES :
1. Chaque phrase gardée DOIT être du français cohérent et compréhensible par un inconnu
2. Si un cut a créé une phrase incompréhensible (mot coupé, phrase tronquée, sujet sans verbe), SUPPRIME le segment entier
3. Identifie le meilleur "hook" dans les 5 premières secondes — la phrase qui accroche
4. Si le hook n'est pas au début, indique à partir de quel segment commencer (on trim le début)
5. Durée finale DOIT être < 58 secondes
6. Préfère un Short de 30s CLAIR à un Short de 50s CONFUS
7. Chaque phrase gardée doit apporter de la VALEUR (conseil, insight, expertise)
8. Supprime les fillers isolés : "voilà", "du coup", "en fait" qui n'apportent rien
9. La dernière phrase doit être un CTA naturel ou suggères-en un`,
    messages: [
      {
        role: "user",
        content: `Voici la transcription segmentée de la vidéo (${totalDuration.toFixed(1)}s après suppression des silences) :

${segmentsList}

Analyse chaque segment et réponds UNIQUEMENT en JSON strict (pas de texte autour) :
{
  "hook_segment_id": <id du segment hook>,
  "segments_to_remove": [<ids des segments incohérents ou sans valeur>],
  "segments_to_keep": [<ids ordonnés des segments à garder>],
  "removal_reasons": {"<id>": "<raison courte>"},
  "estimated_duration_s": <durée estimée après cuts>,
  "final_transcript": "<texte complet des segments gardés>",
  "suggested_cta": "<CTA si nécessaire, sinon vide>",
  "quality_score": <1-10>
}`,
      },
    ],
  });

  // Track costs
  costTracker.addAnthropic("haiku", response.usage.input_tokens, response.usage.output_tokens);

  // Parse response
  const rawText = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`Claude QC a retourné un JSON invalide: ${rawText.slice(0, 200)}`);
  }

  const parsed = JSON.parse(jsonMatch[0]);

  const result: QCResult = {
    hookSegmentId: parsed.hook_segment_id ?? 0,
    segmentsToRemove: parsed.segments_to_remove ?? [],
    segmentsToKeep: parsed.segments_to_keep ?? segments.map(s => s.id),
    removalReasons: parsed.removal_reasons ?? {},
    estimatedDuration: parsed.estimated_duration_s ?? totalDuration,
    finalTranscript: parsed.final_transcript ?? "",
    suggestedCta: parsed.suggested_cta ?? "",
    qualityScore: parsed.quality_score ?? 5,
  };

  console.log(`  ✓ QC score: ${result.qualityScore}/10`);
  console.log(`  ✓ Segments gardés: ${result.segmentsToKeep.length}/${segments.length}`);
  console.log(`  ✓ Durée estimée: ${result.estimatedDuration.toFixed(1)}s`);

  if (result.segmentsToRemove.length > 0) {
    console.log(`  ✂ Segments supprimés:`);
    for (const id of result.segmentsToRemove) {
      console.log(`    - Segment ${id}: ${result.removalReasons[String(id)] || "raison non spécifiée"}`);
    }
  }

  if (result.qualityScore < 6) {
    console.log(`  ⚠ Score QC bas (${result.qualityScore}/10) — vérification manuelle recommandée`);
  }

  return result;
}

// ── Step 4: Apply QC cuts ──

function applyQCCuts(
  videoPath: string,
  segments: TranscriptSegment[],
  qcResult: QCResult
): { videoPath: string; timeOffsets: Record<string, { originalStart: number; newStart: number }> } {
  console.log("\n[4/7] ✂️  Application des coupes QC...");

  const keptSegments = qcResult.segmentsToKeep
    .map(id => segments.find(s => s.id === id))
    .filter((s): s is TranscriptSegment => s !== undefined);

  if (keptSegments.length === 0) {
    throw new Error("Aucun segment gardé après QC — la vidéo est peut-être inutilisable");
  }

  // If all segments are kept in order, skip cutting
  if (
    keptSegments.length === segments.length &&
    keptSegments.every((s, i) => s.id === segments[i].id)
  ) {
    console.log("  ✓ Tous les segments gardés, pas de coupe nécessaire");
    const timeOffsets: Record<string, { originalStart: number; newStart: number }> = {};
    let offset = 0;
    for (const seg of keptSegments) {
      timeOffsets[String(seg.id)] = { originalStart: seg.start, newStart: offset };
      offset += seg.end - seg.start;
    }
    return { videoPath, timeOffsets };
  }

  // Extract each kept segment with audio fades
  const segPaths: string[] = [];
  const timeOffsets: Record<string, { originalStart: number; newStart: number }> = {};
  let currentOffset = 0;

  for (let i = 0; i < keptSegments.length; i++) {
    const seg = keptSegments[i];
    const dur = seg.end - seg.start;
    const segPath = path.join(WORK_DIR, `seg-${i}.mp4`);

    // 30ms audio fades at boundaries to prevent pops
    const fadeOut = Math.max(dur - 0.03, 0);

    execSync(
      `ffmpeg -y -ss ${seg.start.toFixed(3)} -i "${videoPath}" -t ${dur.toFixed(3)} ` +
      `-af "afade=t=in:st=0:d=0.03,afade=t=out:st=${fadeOut.toFixed(3)}:d=0.03" ` +
      `-c:v libx264 -preset fast -crf 22 -c:a aac -b:a 128k "${segPath}"`,
      { stdio: "pipe" }
    );

    segPaths.push(segPath);
    timeOffsets[String(seg.id)] = { originalStart: seg.start, newStart: currentOffset };
    currentOffset += dur;
  }

  // Concat all segments
  const concatListPath = path.join(WORK_DIR, "concat-list.txt");
  fs.writeFileSync(concatListPath, segPaths.map(p => `file '${p}'`).join("\n"));

  const output = path.join(WORK_DIR, "04-qc-cut.mp4");
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${concatListPath}" -c copy "${output}"`,
    { stdio: "pipe" }
  );

  const finalDur = getDuration(output);
  console.log(`  ✓ ${keptSegments.length} segments assemblés → ${finalDur.toFixed(1)}s`);

  if (finalDur > 60) {
    console.log(`  ⚠ Durée > 60s (${finalDur.toFixed(1)}s) — le Short dépassera la limite YouTube`);
  }

  return { videoPath: output, timeOffsets };
}

// ── Step 5: Burn subtitles ──

function burnSubtitles(
  videoPath: string,
  whisperJsonPath: string,
  qcResult: QCResult,
  timeOffsets: Record<string, { originalStart: number; newStart: number }>
): string {
  console.log("\n[5/7] 📝 Sous-titres animés...");

  const output = path.join(WORK_DIR, "05-subtitled.mp4");

  try {
    execSync(
      `python3 "${BURN_SUBTITLES_SCRIPT}" ` +
      `--input "${videoPath}" ` +
      `--whisper-json "${whisperJsonPath}" ` +
      `--output "${output}" ` +
      `--segments-to-keep '${JSON.stringify(qcResult.segmentsToKeep)}' ` +
      `--time-offsets '${JSON.stringify(timeOffsets)}'`,
      { stdio: "inherit", timeout: 180_000 }
    );

    if (fs.existsSync(output) && fs.statSync(output).size > 1000) {
      console.log("  ✓ Sous-titres brûlés avec succès");
      return output;
    }
  } catch (e) {
    console.log(`  ⚠ Erreur burn_subtitles.py: ${e instanceof Error ? e.message : e}`);
  }

  // If subtitle burning failed entirely, use the video without subtitles
  console.log("  ⚠ Sous-titres échoués — export sans sous-titres");
  return videoPath;
}

// ── Step 6: Add music & final export ──

function addMusicAndExport(videoPath: string): string {
  console.log("\n[6/7] 🎵 Musique + export final...");

  const output = path.join(WORK_DIR, "final-short.mp4");
  const musicPath = findMusic();
  const totalDuration = getDuration(videoPath);

  // Check if video needs 9:16 scaling
  const probeRaw = execSync(
    `ffprobe -v quiet -show_entries stream=width,height -of csv=p=0:s=x "${videoPath}"`,
    { encoding: "utf-8" }
  ).trim();
  const [w, h] = probeRaw.split("x").map(Number);
  const needsScale = !w || !h || Math.abs(w / h - 9 / 16) > 0.05;
  const scaleFilter = needsScale
    ? "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,"
    : "";

  if (musicPath) {
    console.log(`  🎵 Musique: ${path.basename(musicPath)}`);
    const fadeOutStart = Math.max(totalDuration - 2, 0).toFixed(2);

    execSync(
      `ffmpeg -y -i "${videoPath}" -i "${musicPath}" ` +
      `-filter_complex "[1:a]volume=0.12,afade=t=in:d=1.5,afade=t=out:st=${fadeOutStart}:d=2[music];[0:a][music]amix=inputs=2:duration=first:dropout_transition=2[aout]" ` +
      `-map 0:v -map "[aout]" ` +
      `-vf "${scaleFilter}fps=30" ` +
      `-c:v libx264 -preset slow -crf 20 ` +
      `-c:a aac -b:a 192k ` +
      `-movflags +faststart ` +
      `"${output}"`,
      { stdio: "pipe", timeout: 180_000 }
    );
  } else {
    console.log("  ⚠ Pas de musique trouvée — export sans musique");
    execSync(
      `ffmpeg -y -i "${videoPath}" ` +
      `-vf "${scaleFilter}fps=30" ` +
      `-c:v libx264 -preset slow -crf 20 ` +
      `-c:a aac -b:a 192k ` +
      `-movflags +faststart ` +
      `"${output}"`,
      { stdio: "pipe", timeout: 180_000 }
    );
  }

  const finalDur = getDuration(output);
  const fileSize = fs.statSync(output).size;
  console.log(`  ✓ Export final: ${finalDur.toFixed(1)}s, ${(fileSize / 1024 / 1024).toFixed(1)}MB`);

  return output;
}

// ── Step 7: Send to Telegram ──

async function sendToTelegram(
  videoPath: string,
  qcResult: QCResult,
  rawDuration: number,
  finalDuration: number,
  totalSegments: number,
  costTracker: CostTracker
): Promise<void> {
  console.log("\n[7/7] 📤 Envoi sur Telegram...");

  const costResult = costTracker.toRunResult();

  const text =
    `🎬 <b>YouTube Short prêt !</b>\n\n` +
    `📊 <b>Stats :</b>\n` +
    `• Durée brute : ${rawDuration.toFixed(1)}s\n` +
    `• Durée finale : ${finalDuration.toFixed(1)}s\n` +
    `• Segments gardés : ${qcResult.segmentsToKeep.length}/${totalSegments}\n` +
    `• QC score : ${qcResult.qualityScore}/10\n` +
    `• Coût IA : ${costResult.costEur.toFixed(4)}€\n\n` +
    `📝 <b>Transcription :</b>\n` +
    `<i>${qcResult.finalTranscript.slice(0, 800)}</i>\n\n` +
    (qcResult.suggestedCta ? `💡 <b>CTA suggéré :</b> ${qcResult.suggestedCta}\n\n` : "") +
    `💬 Vérifie et poste sur YouTube !`;

  // Send text message
  await notifyTelegram(text);

  // Send video file (compress if > 45MB for Telegram's 50MB limit)
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT) {
    console.log("  ⚠ Telegram non configuré — vidéo non envoyée");
    return;
  }

  let videoToSend = videoPath;
  const fileSize = fs.statSync(videoPath).size;
  if (fileSize > 45 * 1024 * 1024) {
    console.log(`  📦 Compression pour Telegram (${(fileSize / 1024 / 1024).toFixed(0)}MB > 45MB)...`);
    const compressed = videoPath.replace(".mp4", "-tg.mp4");
    try {
      execSync(
        `ffmpeg -y -i "${videoPath}" -c:v libx264 -preset slow -crf 28 -c:a aac -b:a 96k -movflags +faststart "${compressed}"`,
        { stdio: "pipe", timeout: 120_000 }
      );
      if (fs.existsSync(compressed) && fs.statSync(compressed).size < 50 * 1024 * 1024) {
        videoToSend = compressed;
        console.log(`  ✓ Compressé: ${(fs.statSync(compressed).size / 1024 / 1024).toFixed(0)}MB`);
      }
    } catch {
      console.log("  ⚠ Compression échouée, tentative d'envoi tel quel");
    }
  }

  try {
    const formData = new FormData();
    formData.append("chat_id", TELEGRAM_CHAT);
    formData.append(
      "video",
      new Blob([fs.readFileSync(videoToSend)], { type: "video/mp4" }),
      "youtube-short.mp4"
    );
    formData.append("supports_streaming", "true");

    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendVideo`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (data.ok) {
      console.log("  ✓ Vidéo envoyée sur Telegram !");
    } else {
      console.log(`  ⚠ Erreur Telegram: ${JSON.stringify(data)}`);
    }
  } catch (e) {
    console.warn(`  ⚠ Telegram video: ${e instanceof Error ? e.message : e}`);
  }
}

// ── Main ──

async function main() {
  const inputPath = process.argv[2];

  if (!inputPath) {
    console.error("Usage: npx tsx scripts/agents/shorts-editor-agent.ts /path/to/video.mp4");
    process.exit(1);
  }

  const resolvedInput = path.resolve(inputPath);
  if (!fs.existsSync(resolvedInput)) {
    console.error(`❌ Fichier introuvable: ${resolvedInput}`);
    process.exit(1);
  }

  const ext = path.extname(resolvedInput).toLowerCase();
  if (![".mp4", ".mov", ".mkv", ".webm"].includes(ext)) {
    console.error(`❌ Format non supporté: ${ext} (attendu: .mp4, .mov, .mkv, .webm)`);
    process.exit(1);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("❌ ANTHROPIC_API_KEY manquant dans .env.local");
    process.exit(1);
  }

  // Setup
  fs.mkdirSync(WORK_DIR, { recursive: true });
  const costTracker = createCostTracker();
  const runId = await startRun("shorts-editor", { input: path.basename(resolvedInput) });
  const rawDuration = getDuration(resolvedInput);

  console.log(`\n🚀 Shorts Editor — ${path.basename(resolvedInput)} (${rawDuration.toFixed(1)}s)`);
  console.log("═".repeat(60));

  try {
    // Step 0: Preprocess if needed (4K, HEVC, HDR → 1080p H.264 SDR)
    const processedInput = preprocessIfNeeded(resolvedInput);

    // Step 1: Remove silences
    const silenceRemoved = removeSilences(processedInput);

    // Step 2: Transcribe
    const { segments, whisperJsonPath } = transcribeVideo(silenceRemoved);

    // Step 3: QC validation
    const silenceDur = getDuration(silenceRemoved);
    const qcResult = await qcValidation(segments, silenceDur, costTracker);

    // Step 4: Apply QC cuts
    const { videoPath: qcCutVideo, timeOffsets } = applyQCCuts(silenceRemoved, segments, qcResult);

    // Step 5: Burn subtitles
    const subtitledVideo = burnSubtitles(qcCutVideo, whisperJsonPath, qcResult, timeOffsets);

    // Step 6: Music + final export
    const finalVideo = addMusicAndExport(subtitledVideo);

    // Copy result next to source file
    const finalDuration = getDuration(finalVideo);
    const sourceDir = path.dirname(resolvedInput);
    const sourceName = path.basename(resolvedInput, path.extname(resolvedInput));
    const outputCopy = path.join(sourceDir, `${sourceName}-SHORT.mp4`);
    fs.copyFileSync(finalVideo, outputCopy);
    console.log(`\n  📁 Copié: ${outputCopy}`);

    // Step 7: Telegram
    await sendToTelegram(finalVideo, qcResult, rawDuration, finalDuration, segments.length, costTracker);

    // Cleanup intermediate files (keep final + whisper JSON)
    const keepFiles = new Set([
      path.basename(finalVideo),
      path.basename(whisperJsonPath),
      "remapped-whisper.json",
    ]);
    for (const file of fs.readdirSync(WORK_DIR)) {
      if (!keepFiles.has(file) && !file.startsWith("final")) {
        try { fs.unlinkSync(path.join(WORK_DIR, file)); } catch {}
      }
    }

    // Finish run
    const costResult = costTracker.toRunResult();
    await finishRun(runId, {
      status: "success",
      itemsProcessed: 1,
      itemsCreated: 1,
      costEur: costResult.costEur,
      tokensInput: costResult.tokensInput,
      tokensOutput: costResult.tokensOutput,
      apiCosts: costResult.apiCosts,
      metadata: {
        rawDuration,
        finalDuration,
        segmentsKept: qcResult.segmentsToKeep.length,
        segmentsTotal: segments.length,
        qualityScore: qcResult.qualityScore,
      },
    });

    console.log("\n═".repeat(60));
    console.log(`✅ Short prêt : ${finalVideo}`);
    console.log(`   Durée : ${rawDuration.toFixed(1)}s → ${finalDuration.toFixed(1)}s`);
    console.log(`   Coût : ${costResult.costEur.toFixed(4)}€`);

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`\n❌ Erreur: ${msg}`);
    await notifyTelegram(`❌ Shorts Editor échoué: ${msg}`);
    await finishRun(runId, { status: "error", error: msg, ...costTracker.toRunResult() });
    process.exit(1);
  }
}

main();
