/**
 * Reel Producer — produit un Reel à partir d'une idée de la banque
 * Exécution : 3x/semaine (cron) ou manuellement
 * npx tsx scripts/agents/reel-producer.ts
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

require("dotenv").config({ path: ".env.local" });

const GROQ_KEY = process.env.GROQ_API_KEY!;
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_CHAT = process.env.TELEGRAM_CHAT_ID!;

const VIDEO_DIR = "/Users/julesgaveglio/Desktop/Vidéo Vanzon for Remotion";
const MUSIC_DIR = path.join(process.cwd(), "public/reel-music");
const WORK_DIR = "/tmp/vanzon-reel-producer";
const IDEAS_PATH = path.join(process.cwd(), "Vanzon Memory Database/🌐 PUBLIC/social/📋 Reel Ideas Bank.md");
const HISTORY_PATH = path.join(process.cwd(), "Vanzon Memory Database/🌐 PUBLIC/social/📜 Reels publiés — Historique.md");

async function groqChat(messages: { role: string; content: string }[]): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.7,
      max_tokens: 1500,
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// Pick next idea from bank
function pickNextIdea(): { id: number; concept: string; style: string; mood: string } | null {
  if (!fs.existsSync(IDEAS_PATH)) return null;
  const content = fs.readFileSync(IDEAS_PATH, "utf-8");
  const lines = content.split("\n").filter((l) => l.includes("| 💡 |"));
  if (lines.length === 0) return null;

  const line = lines[0]; // First available idea
  const cols = line.split("|").map((c) => c.trim()).filter(Boolean);
  return {
    id: parseInt(cols[0]),
    concept: cols[2],
    style: cols[3],
    mood: cols[4],
  };
}

// Mark idea as in production
function markIdeaStatus(id: number, status: string) {
  const content = fs.readFileSync(IDEAS_PATH, "utf-8");
  const updated = content.replace(
    new RegExp(`\\| ${id} \\| 💡 \\|`),
    `| ${id} | ${status} |`
  );
  fs.writeFileSync(IDEAS_PATH, updated);
}

// Get available video clips with metadata
function getAvailableClips(): { file: string; name: string; duration: number }[] {
  if (!fs.existsSync(VIDEO_DIR)) return [];
  return fs
    .readdirSync(VIDEO_DIR)
    .filter((f) => f.endsWith(".mov") || f.endsWith(".mp4"))
    .map((f) => {
      const fullPath = path.join(VIDEO_DIR, f);
      try {
        const probe = execSync(
          `ffprobe -v quiet -print_format json -show_streams "${fullPath}"`,
          { encoding: "utf-8" }
        );
        const data = JSON.parse(probe);
        const stream = data.streams?.find((s: any) => s.codec_type === "video");
        return {
          file: fullPath,
          name: f,
          duration: parseFloat(stream?.duration ?? "0"),
        };
      } catch {
        return { file: fullPath, name: f, duration: 0 };
      }
    })
    .filter((v) => v.duration > 0);
}

// Find music matching the mood
function findMusic(mood: string): string | null {
  // Check mood-specific directory
  const moodDir = path.join(MUSIC_DIR, mood);
  if (fs.existsSync(moodDir)) {
    const files = fs.readdirSync(moodDir).filter((f) => f.endsWith(".mp3"));
    if (files.length > 0) {
      const pick = files[Math.floor(Math.random() * files.length)];
      return path.join(moodDir, pick);
    }
  }

  // Fallback: any MP3 in the music dir
  if (fs.existsSync(MUSIC_DIR)) {
    const files = fs.readdirSync(MUSIC_DIR).filter((f) => f.endsWith(".mp3"));
    if (files.length > 0) return path.join(MUSIC_DIR, files[0]);
  }

  // Last fallback: generated ambient
  const ambient = path.join(MUSIC_DIR, "ambient-vanlife.mp3");
  return fs.existsSync(ambient) ? ambient : null;
}

// Plan montage with Groq
async function planMontage(
  concept: string,
  style: string,
  clips: { name: string; duration: number }[]
) {
  const clipList = clips.map((c) => `- ${c.name} (${c.duration.toFixed(1)}s)`).join("\n");

  const response = await groqChat([
    {
      role: "system",
      content: `Tu es un monteur vidéo expert Instagram Reels pour Vanzon Explorer (location vans aménagés, Pays Basque).

RÈGLES :
- Durée totale : 18-25 secondes
- Chaque clip : 2.5-5 secondes
- Commence par le clip le plus visuel/accrocheur
- Caption : 2-3 lignes max, authentique, pas commercial
- Hashtags : 10 max, pertinents vanlife France
- Text overlays : 3-5 mots max par apparition, police bold`,
    },
    {
      role: "user",
      content: `Concept du Reel : "${concept}"
Style de montage : "${style}"

Clips disponibles :
${clipList}

Planifie le montage. Réponds UNIQUEMENT en JSON :
{
  "clips": [
    { "file": "nom.mov", "start": 0.0, "end": 3.5, "description": "..." }
  ],
  "texts": [
    { "clip_index": 0, "text": "Texte court", "appear_at": 0.5 }
  ],
  "caption": "Caption Instagram 2-3 lignes",
  "hashtags": "#vanlife #hashtag2 ..."
}`,
    },
  ]);

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Groq montage plan invalid");
  return JSON.parse(jsonMatch[0]);
}

// Cut and assemble with ffmpeg
function produceReel(
  plan: any,
  musicPath: string | null
): string {
  console.log("\n✂️  Découpe des clips...");
  const cutPaths: string[] = [];

  for (let i = 0; i < plan.clips.length; i++) {
    const clip = plan.clips[i];
    const fullPath = path.join(VIDEO_DIR, clip.file);
    if (!fs.existsSync(fullPath)) {
      console.log(`  ⚠ Clip introuvable: ${clip.file}, skip`);
      continue;
    }

    const outPath = path.join(WORK_DIR, `cut-${i}.mp4`);
    const duration = clip.end - clip.start;

    execSync(
      `ffmpeg -y -ss ${clip.start} -i "${fullPath}" -t ${duration} -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1" -c:v libx264 -preset fast -crf 23 -an "${outPath}"`,
      { stdio: "pipe" }
    );

    cutPaths.push(outPath);
    console.log(`  ✓ Clip ${i + 1}: ${clip.file} [${clip.start}s → ${clip.end}s]`);
  }

  if (cutPaths.length === 0) throw new Error("Aucun clip découpé");

  // Concatenate
  console.log("\n🎬 Assemblage...");
  const listPath = path.join(WORK_DIR, "clips.txt");
  fs.writeFileSync(listPath, cutPaths.map((p) => `file '${p}'`).join("\n"));

  const concatPath = path.join(WORK_DIR, "concat.mp4");
  execSync(
    `ffmpeg -y -f concat -safe 0 -i "${listPath}" -c:v libx264 -preset fast -crf 23 "${concatPath}"`,
    { stdio: "pipe" }
  );

  // Add music + fade
  const finalPath = path.join(WORK_DIR, "reel-final.mp4");
  if (musicPath && fs.existsSync(musicPath)) {
    const totalDuration = parseFloat(
      execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${concatPath}"`, { encoding: "utf-8" }).trim()
    );

    execSync(
      `ffmpeg -y -i "${concatPath}" -i "${musicPath}" -filter_complex "[0:v]fade=t=in:d=0.4,fade=t=out:st=${(totalDuration - 0.4).toFixed(2)}:d=0.4[v];[1:a]afade=t=in:d=1,afade=t=out:st=${(totalDuration - 2).toFixed(2)}:d=2,volume=0.7[a]" -map "[v]" -map "[a]" -c:v libx264 -preset fast -crf 22 -c:a aac -shortest "${finalPath}"`,
      { stdio: "pipe" }
    );
    console.log(`  ✓ Musique ajoutée`);
  } else {
    fs.copyFileSync(concatPath, finalPath);
    console.log("  ⚠ Pas de musique trouvée, reel sans son");
  }

  const size = fs.statSync(finalPath).size;
  console.log(`  ✓ Reel final : ${(size / 1024 / 1024).toFixed(1)}MB`);

  return finalPath;
}

// Send to Telegram
async function sendToTelegram(videoPath: string, caption: string, hashtags: string, concept: string) {
  console.log("\n📤 Envoi sur Telegram...");

  const text = `🎬 <b>Nouveau Reel prêt !</b>\n\n📌 Concept : ${concept}\n\n${caption}\n\n${hashtags}\n\n💬 Réponds "go" pour publier sur Instagram`;

  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: TELEGRAM_CHAT, text, parse_mode: "HTML" }),
  });

  const formData = new FormData();
  formData.append("chat_id", TELEGRAM_CHAT);
  formData.append("video", new Blob([fs.readFileSync(videoPath)], { type: "video/mp4" }), "reel-vanzon.mp4");
  formData.append("supports_streaming", "true");

  const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendVideo`, {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (data.ok) console.log("  ✓ Reel envoyé sur Telegram !");
  else console.error("  ✗ Erreur:", JSON.stringify(data));
}

// ── Main ──
async function main() {
  fs.mkdirSync(WORK_DIR, { recursive: true });

  // 1. Pick next idea
  const idea = pickNextIdea();
  if (!idea) {
    console.log("💡 Aucune idée disponible. Lance d'abord : npx tsx scripts/agents/social-trend-scraper.ts");
    return;
  }
  console.log(`💡 Idée #${idea.id}: "${idea.concept}" [${idea.mood}]\n`);

  // 2. Get available clips
  const clips = getAvailableClips();
  if (clips.length === 0) {
    console.log("📁 Aucun clip vidéo trouvé dans " + VIDEO_DIR);
    return;
  }
  console.log(`📁 ${clips.length} clips disponibles`);

  // 3. Find music
  const music = findMusic(idea.mood);
  console.log(`🎵 Musique: ${music ? path.basename(music) : "aucune (ambient fallback)"}`);

  // 4. Plan montage with AI
  console.log("\n🧠 Planification du montage...");
  const plan = await planMontage(
    idea.concept,
    idea.style,
    clips.map((c) => ({ name: c.name, duration: c.duration }))
  );
  console.log(`  ✓ ${plan.clips.length} clips planifiés`);
  console.log(`  ✓ Caption: "${plan.caption?.slice(0, 60)}..."`);

  // 5. Produce reel
  const reelPath = produceReel(plan, music);

  // 6. Send to Telegram
  await sendToTelegram(reelPath, plan.caption ?? "", plan.hashtags ?? "", idea.concept);

  // 7. Mark idea as in production
  markIdeaStatus(idea.id, "🎬");
  console.log(`\n✅ Idée #${idea.id} marquée "en production"`);
}

main().catch((e) => {
  console.error("❌ Erreur:", e.message);
  process.exit(1);
});
