import { NextRequest, NextResponse } from "next/server";
import { requireAdsAuth } from "@/lib/ads-auth";
import { readdir, readFile } from "fs/promises";
import path from "path";

const TRANSCRIPTS_DIR = path.join(process.cwd(), "closing-transcripts");

const GROQ_MODELS = {
  chat: "llama-3.3-70b-versatile",
  whisper: "whisper-large-v3",
};

const SYSTEM_PROMPT = `Tu es un analyste commercial expert. Tu analyses des transcripts d'appels de closing pour en extraire les informations exploitables.

Tu DOIS structurer ta réponse EXACTEMENT ainsi (en markdown) :

## Données prospect
- **Profil** : [qui est le prospect, sa situation]
- **Besoin** : [ce qu'il cherche concrètement]
- **Budget** : [budget mentionné, capacité financière]
- **Objections** : [freins exprimés ou sous-entendus]
- **Signaux d'achat** : [indices positifs, moments d'engagement]

## Points clés du closing
- **Ce qui a fonctionné** : [arguments/moments qui ont eu de l'impact]
- **Ce qui a bloqué** : [résistances, hésitations]
- **Étapes de la négociation** : [déroulé chronologique résumé]

## Data réutilisable
- **Chiffres clés** : [tous les montants, durées, pourcentages mentionnés]
- **Verbatims importants** : [citations exactes exploitables]
- **Contexte décisionnel** : [qui décide, quand, quelles conditions]

## Actions / next steps
- [action 1 concrète avec deadline si mentionnée]
- [action 2...]

RÈGLES :
- Concision maximale. Pas de remplissage.
- Ne garde que ce qui sert à piloter les ventes.
- Cite les verbatims entre guillemets.
- Si une info n'est pas dans le transcript, écris "Non mentionné".`;

async function transcribeAudio(filePath: string): Promise<string> {
  const audioBuffer = await readFile(filePath);
  const formData = new FormData();
  formData.append("file", new Blob([audioBuffer]), path.basename(filePath));
  formData.append("model", GROQ_MODELS.whisper);
  formData.append("language", "fr");
  formData.append("response_format", "text");

  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq Whisper error: ${res.status} — ${err}`);
  }

  return res.text();
}

async function analyzeTranscript(transcript: string, filename: string): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODELS.chat,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Voici le transcript de l'appel de closing "${filename}":\n\n${transcript}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq chat error: ${res.status} — ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "Aucune analyse générée.";
}

// GET — list available transcripts
export async function GET() {
  const check = await requireAdsAuth();
  if (check instanceof NextResponse) return check;

  try {
    const files = await readdir(TRANSCRIPTS_DIR);
    const transcripts = files
      .filter((f) => /\.(txt|m4a|mp3|wav|webm)$/i.test(f))
      .map((f) => {
        const isAudio = /\.(m4a|mp3|wav|webm)$/i.test(f);
        const name = f.replace(/\.(txt|m4a|mp3|wav|webm)$/i, "").replace(/[-_]/g, " ");
        return { filename: f, name, isAudio };
      });

    return NextResponse.json({ transcripts });
  } catch {
    return NextResponse.json({ transcripts: [] });
  }
}

// POST — generate summary for a specific file
export async function POST(req: NextRequest) {
  const check = await requireAdsAuth();
  if (check instanceof NextResponse) return check;

  const { filename } = await req.json();
  if (!filename) {
    return NextResponse.json({ error: "filename required" }, { status: 400 });
  }

  // Sanitize filename
  const safe = path.basename(filename);
  const filePath = path.join(TRANSCRIPTS_DIR, safe);

  try {
    let transcript: string;
    const isAudio = /\.(m4a|mp3|wav|webm)$/i.test(safe);

    if (isAudio) {
      transcript = await transcribeAudio(filePath);
    } else {
      transcript = await readFile(filePath, "utf-8");
    }

    if (!transcript.trim()) {
      return NextResponse.json({ error: "Transcript vide" }, { status: 400 });
    }

    const summary = await analyzeTranscript(transcript, safe);

    return NextResponse.json({ summary, transcript_length: transcript.length, was_audio: isAudio });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
