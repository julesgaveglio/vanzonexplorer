import Groq from "groq-sdk";

type Message = { role: "user" | "assistant" | "system"; content: string };

interface GroqFallbackOptions {
  messages: Message[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" };
}

export interface GroqFallbackResult {
  content: string;
  modelUsed: string;
  fallbackUsed: boolean;
}

/**
 * Cascade Groq → Gemini.
 *
 * Ordre : modèle demandé × (GROQ_API_KEY → KEY_2 → KEY_3)
 *         puis modèles légers (llama-3.1-8b-instant, gemma2-9b-it) × toutes les clés
 *         puis Gemini 2.5 Flash via REST (dernier recours)
 *
 * Usage :
 *   const { content } = await groqWithFallback({ messages, model: "llama-3.3-70b-versatile", temperature: 0.7 });
 */
export async function groqWithFallback(opts: GroqFallbackOptions): Promise<GroqFallbackResult> {
  const {
    messages,
    model: requestedModel = "llama-3.3-70b-versatile",
    temperature = 0.7,
    max_tokens,
    response_format,
  } = opts;

  const keys = [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
  ].filter(Boolean) as string[];

  // Modèles ordonnés : demandé d'abord, puis légers en fallback
  const models = [
    requestedModel,
    ...["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "gemma2-9b-it"].filter(
      (m) => m !== requestedModel
    ),
  ];

  let lastError: Error = new Error("Aucune clé Groq configurée");
  let attemptIndex = 0;

  for (const model of models) {
    for (const apiKey of keys) {
      try {
        const groq = new Groq({ apiKey });
        const completion = await groq.chat.completions.create({
          model,
          messages,
          temperature,
          ...(max_tokens != null && { max_tokens }),
          ...(response_format && { response_format }),
        });
        const content = completion.choices[0]?.message?.content ?? "";
        return { content, modelUsed: `${model}@groq`, fallbackUsed: attemptIndex > 0 };
      } catch (err) {
        lastError = err as Error;
        console.warn(`[groq-fallback] ${model}@groq failed: ${lastError.message.slice(0, 120)}`);
        attemptIndex++;
      }
    }
  }

  // ── Dernier recours : Gemini 2.5 Flash via REST ──────────────────────────
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const systemMsg = messages.find((m) => m.role === "system");
      const userMsgs = messages.filter((m) => m.role !== "system");
      const parts = userMsgs.map((m) => ({ text: m.content }));

      const body: Record<string, unknown> = {
        contents: [{ parts }],
        generationConfig: {
          temperature,
          ...(max_tokens != null && { maxOutputTokens: max_tokens }),
          ...(response_format?.type === "json_object" && {
            responseMimeType: "application/json",
          }),
        },
      };

      if (systemMsg) {
        body.systemInstruction = { parts: [{ text: systemMsg.content }] };
      }

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(30000),
        }
      );

      if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);

      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      return { content, modelUsed: "gemini-2.5-flash", fallbackUsed: true };
    } catch (err) {
      console.warn(`[groq-fallback] gemini fallback failed: ${(err as Error).message}`);
    }
  }

  throw lastError;
}
