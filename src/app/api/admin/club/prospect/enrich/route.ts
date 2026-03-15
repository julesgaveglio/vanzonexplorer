import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { createSupabaseAdmin } from "@/lib/supabase/server";

function sseEvent(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

async function fetchWithJina(url: string): Promise<string> {
  try {
    const response = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        Authorization: `Bearer ${process.env.JINA_API_KEY}`,
        Accept: "text/plain",
        "X-Return-Format": "markdown",
        "X-Timeout": "20",
      },
    });
    if (!response.ok) return "";
    return await response.text();
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { prospectId, website }: { prospectId: string; website: string } = body;

  if (!prospectId || !website) {
    return new Response(
      `data: ${JSON.stringify({ type: "log", level: "error", message: "prospectId et website sont requis" })}\n\n`,
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        },
      }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(sseEvent(data)));
      };

      try {
        send({
          type: "log",
          level: "info",
          message: `Scraping ${website}...`,
        });

        // Normalize website URL
        const baseUrl = website.endsWith("/") ? website.slice(0, -1) : website;

        // Fetch main page + contact + a-propos in parallel
        const [mainContent, contactContent, aboutContent] = await Promise.all([
          fetchWithJina(baseUrl),
          fetchWithJina(`${baseUrl}/contact`),
          fetchWithJina(`${baseUrl}/a-propos`),
        ]);

        const combinedContent = [
          mainContent ? `=== PAGE PRINCIPALE ===\n${mainContent}` : "",
          contactContent ? `=== PAGE CONTACT ===\n${contactContent}` : "",
          aboutContent ? `=== PAGE A PROPOS ===\n${aboutContent}` : "",
        ]
          .filter(Boolean)
          .join("\n\n");

        send({
          type: "log",
          level: "info",
          message: `Analyse Groq pour extraire les contacts...`,
        });

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const groqResponse = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "user",
              content: `Tu es un expert en prospection B2B. Analyse ce contenu web et extrait:
1. Tous les emails trouvés (tableau de strings)
2. Les contacts stratégiques (priorité: partenariat > marketing > commercial > direction > contact général)
Pour chaque contact: name, role, email (ou null si pas d'email), priority (1=plus haute priorité).
Réponds UNIQUEMENT avec: { "emails": ["email@example.com"], "contacts": [{"name": "...", "role": "...", "email": "...", "priority": 1}] }

Contenu web:
${combinedContent.substring(0, 6000)}`,
            },
          ],
          temperature: 0.2,
          max_tokens: 2000,
        });

        const rawContent = groqResponse.choices[0]?.message?.content || "{}";

        interface EnrichResult {
          emails: string[];
          contacts: Array<{ name: string; role: string; email: string | null; priority: number }>;
        }

        let enrichResult: EnrichResult = { emails: [], contacts: [] };
        try {
          const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            enrichResult = JSON.parse(jsonMatch[0]);
          } else {
            enrichResult = JSON.parse(rawContent);
          }
        } catch {
          send({
            type: "log",
            level: "error",
            message: "Erreur parsing JSON Groq: " + rawContent.substring(0, 200),
          });
        }

        // Update prospect in DB
        const supabase = createSupabaseAdmin();
        await supabase
          .from("prospects")
          .update({
            emails: enrichResult.emails || [],
            contacts: enrichResult.contacts || [],
            status: "enrichi",
            updated_at: new Date().toISOString(),
          })
          .eq("id", prospectId);

        send({
          type: "log",
          level: "success",
          message: `${enrichResult.emails?.length || 0} emails et ${enrichResult.contacts?.length || 0} contacts trouvés`,
        });

        send({
          type: "result",
          emails: enrichResult.emails || [],
          contacts: enrichResult.contacts || [],
        });

        send({ type: "done", count: (enrichResult.emails?.length || 0) + (enrichResult.contacts?.length || 0) });
      } catch (error) {
        send({
          type: "log",
          level: "error",
          message: `Erreur: ${error instanceof Error ? error.message : String(error)}`,
        });
        send({ type: "done", count: 0 });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
