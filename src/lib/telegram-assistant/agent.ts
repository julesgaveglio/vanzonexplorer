// src/lib/telegram-assistant/agent.ts
// Boucle principale de l'agent Telegram avec Groq tool-calling natif.
// Remplace le système intent+registry de l'ancienne architecture.

import Groq from "groq-sdk";
import { TOOL_DEFINITIONS } from "./tools/definitions";
import { executeTool } from "./tools/executors";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

async function tgSend(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

const SYSTEM_PROMPT = `Tu es l'assistant personnel de Jules Gaveglio, fondateur de Vanzon Explorer (location de vans aménagés au Pays Basque, France).
Tu as accès à la base de données du site web et à sa boîte Gmail professionnelle (jules@vanzonexplorer.com).

Comportement :
- Réponds toujours en français, de manière concise et directe
- Pour les questions sur les données (road trips, membres, prospects), utilise les outils de recherche et synthétise les résultats
- Pour envoyer ou répondre à un email, utilise les outils dédiés — ils affichent toujours un aperçu avant d'envoyer
- Ne mentionne pas les IDs techniques dans tes réponses, utilise les prénoms et informations lisibles
- Si une recherche retourne 0 résultats, dis-le clairement et propose d'élargir les critères`;

export async function runAgent(message: string, chatId: number): Promise<void> {
  const keys = [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
  ].filter(Boolean) as string[];

  let groq = new Groq({ apiKey: keys[0] });

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user",   content: message },
  ];

  // Boucle agentique : max 4 tours (message → outils → outils → réponse finale)
  for (let turn = 0; turn < 4; turn++) {
    let response;
    try {
      response = await groq.chat.completions.create({
      model:       "llama-3.3-70b-versatile",
      messages,
      tools:       TOOL_DEFINITIONS,
        tool_choice: "auto",
        temperature: 0.3,
        max_tokens:  1000,
      });
    } catch (err) {
      const msg = String(err);
      // Rotation de clé si rate limit
      if (msg.includes("429") && keys.length > 1) {
        const nextKey = keys.find(k => k !== groq.apiKey);
        if (nextKey) { groq = new Groq({ apiKey: nextKey }); continue; }
      }
      await tgSend(chatId, "⚠️ Assistant temporairement indisponible. Réessaie dans quelques minutes.");
      return;
    }

    const choice = response.choices[0];
    if (!choice) break;

    const hasToolCalls = choice.message.tool_calls?.length;

    // Groq a répondu sans appeler d'outils → réponse finale
    if (!hasToolCalls) {
      const text = choice.message.content;
      if (text) await tgSend(chatId, text);
      return;
    }

    // Groq appelle des outils — les ajouter au contexte
    messages.push({
      role:       "assistant",
      content:    choice.message.content ?? null,
      tool_calls: choice.message.tool_calls,
    } as Groq.Chat.ChatCompletionAssistantMessageParam);

    let hasEmailPreview = false;

    for (const toolCall of choice.message.tool_calls!) {
      const args   = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
      const result = await executeTool(toolCall.function.name, args, chatId);

      // Ces outils envoient leur propre aperçu Telegram — pas besoin de réponse supplémentaire
      if (
        toolCall.function.name === "send_email_to_road_tripper" ||
        toolCall.function.name === "reply_to_email"
      ) {
        hasEmailPreview = true;
      }

      messages.push({
        role:         "tool",
        tool_call_id: toolCall.id,
        content:      result,
      });
    }

    // Un aperçu email a été envoyé — Groq n'a pas besoin d'envoyer un message de plus
    if (hasEmailPreview) return;
  }

  // Sécurité : si on sort de la boucle sans réponse
  await tgSend(chatId, "⚠️ Je n'ai pas pu terminer. Réessaie.");
}
