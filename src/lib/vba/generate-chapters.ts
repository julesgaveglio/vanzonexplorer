import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface Chapter {
  title: string;
  time: number;
}

const SYSTEM_PROMPT = `Tu es un editeur video professionnel. A partir de cette transcription d'une video de formation sur le van amenage, identifie les changements de sujet majeurs et genere des chapitres.

Regles :
- Maximum 8 chapitres par video
- Minimum 2 minutes entre chaque chapitre
- Titres courts (3-6 mots), clairs, professionnels
- Le premier chapitre commence toujours a 0 secondes
- Ignore les digressions, blagues, hesitations — ne garde que les vrais changements de sujet
- Reponds UNIQUEMENT en JSON valide avec la cle "chapters" : {"chapters":[{"title":"...","time":0},...]}
- Si la video est courte (moins de 5 minutes), 2-3 chapitres suffisent`;

export async function generateChapters(
  transcript: string,
  segments: Array<{ start: number; end: number; text: string }>
): Promise<Chapter[]> {
  const timestamped = segments
    .map((s) => `[${formatTime(s.start)}] ${s.text}`)
    .join("\n");

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: timestamped },
    ],
    temperature: 0.3,
    max_tokens: 1024,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content ?? "[]";

  try {
    const parsed = JSON.parse(raw);
    const chapters: Chapter[] = Array.isArray(parsed)
      ? parsed
      : parsed.chapters ?? [];

    return chapters
      .filter(
        (c: Chapter) =>
          typeof c.title === "string" &&
          typeof c.time === "number" &&
          c.time >= 0
      )
      .sort((a: Chapter, b: Chapter) => a.time - b.time);
  } catch {
    return [{ title: "Introduction", time: 0 }];
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
