// src/lib/telegram-assistant/intent.ts
// Parse un message Telegram en langage naturel → { action, params }
// via Groq llama-3.3-70b avec validation Zod.

import Groq from "groq-sdk";
import { z } from "zod";

const IntentSchema = z.object({
  action: z.string(),
  params: z.record(z.string(), z.string()),
});

export type ParsedIntent = z.infer<typeof IntentSchema>;

export async function parseIntent(
  message: string,
  availableActions: Array<{ name: string; description: string }>
): Promise<ParsedIntent> {
  const actionsText = availableActions
    .map((a) => `- "${a.name}": ${a.description}`)
    .join("\n");

  const systemPrompt = `Tu es l'assistant de Jules Gaveglio (fondateur de Vanzon Explorer).
Tu reçois des messages en langage naturel et tu dois identifier l'action à effectuer.

Actions disponibles :
${actionsText}
- "unknown": si aucune action ne correspond

Réponds UNIQUEMENT avec du JSON valide, sans texte avant ou après :
{
  "action": "<nom_de_l_action>",
  "params": { "<clé>": "<valeur>" }
}

Exemples :
- "envoie un email à Séverine pour son retour road trip" → {"action":"send_email","params":{"prenom":"Séverine","email_type":"road_trip_feedback"}}
- "c'est quoi ma prochaine résa ?" → {"action":"get_next_reservation","params":{}}
- "bonjour" → {"action":"unknown","params":{"fallback_message":"Bonjour ! Je peux envoyer des emails ou consulter tes réservations."}}`;

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: message },
      ],
      temperature: 0,
      max_tokens:  200,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const parsed = JSON.parse(cleaned);
    return IntentSchema.parse(parsed);
  } catch {
    return { action: "unknown", params: { fallback_message: "Je n'ai pas compris 🤷 Réessaie autrement." } };
  }
}
