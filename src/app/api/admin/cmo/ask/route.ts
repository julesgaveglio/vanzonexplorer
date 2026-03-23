import { NextRequest } from "next/server";
import Groq from "groq-sdk";

function sseEvent(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

const CMO_SYSTEM_PROMPT = `Tu es le Directeur Marketing 360° de Vanzon Explorer, une entreprise de location et vente de vans aménagés au Pays Basque (Biarritz area).

Contexte entreprise :
- Site : vanzonexplorer.com, départ depuis Cambo-les-Bains (64250)
- Modèle : Location (65-95€/jour selon saison) + Vente van (40-80k€) + Formation + Club Privé
- Saisons : Haute (15/04→15/09), Moyenne (mars-avril, sept-oct), Basse (oct→mars)

Frameworks de référence :
- AARRR adapté : Acquisition (SEO local, Yescapa) → Activation (devis/réservation) → Retention (Club Privé) → Referral (ambassadeurs, avis) → Revenue (multi-streams)
- ICE Scoring sur chaque recommandation : Impact × Confidence × Ease / 100
- Seasonal Matrix : adapter les priorités à la saison en cours

Tu produis des analyses marketing concrètes, priorisées par ICE score, adaptées à une PME. Sois direct, actionnable, précis.`;

export async function POST(req: NextRequest) {
  const { question } = (await req.json()) as { question: string };

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(sseEvent(data)));
      };

      try {
        send({ type: "start" });

        const completion = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: CMO_SYSTEM_PROMPT },
            { role: "user", content: question },
          ],
          stream: true,
          max_tokens: 2048,
        });

        let fullText = "";
        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content ?? "";
          if (delta) {
            fullText += delta;
            send({ type: "delta", text: delta });
          }
        }

        send({ type: "done", fullText });
      } catch (err) {
        send({ type: "error", message: err instanceof Error ? err.message : "Erreur inconnue" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
