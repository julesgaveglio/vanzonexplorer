/**
 * Facebook Webhook — commentaires de Page → DM Messenger avec la ressource PDF
 *
 * Boucle complète :
 * 1. Quelqu'un commente sous un Reel/post ("liste", "je veux le guide"…)
 * 2. Meta pousse l'événement `feed` ici
 * 3. Classification Claude Haiku contre le catalogue Supabase `ressources`
 *    (fast-path sans IA si le commentaire contient directement le mot-clé)
 * 4. Private Reply Messenger avec un bouton vers la page de téléchargement
 *
 * Idempotence via la table `fb_webhook_events` (comment_id en clé primaire) :
 * Meta renvoie parfois le même événement plusieurs fois, on n'envoie jamais
 * deux fois le DM.
 *
 * Env requises : FB_PAGE_ACCESS_TOKEN, FB_WEBHOOK_VERIFY_TOKEN, FB_PAGE_ID.
 * Optionnelle : FB_APP_SECRET (vérification de signature X-Hub-Signature-256).
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

const GRAPH = "https://graph.facebook.com/v23.0";

// ── Types (sous-ensemble utile du payload webhook `feed`) ──

interface FeedChangeValue {
  item?: string; // "comment", "reaction", "post"…
  verb?: string; // "add", "edited", "remove"…
  comment_id?: string;
  post_id?: string;
  message?: string; // texte du commentaire
  from?: { id?: string; name?: string };
}

interface WebhookBody {
  object?: string;
  entry?: Array<{
    id?: string;
    changes?: Array<{ field?: string; value?: FeedChangeValue }>;
  }>;
}

interface Ressource {
  slug: string;
  titre: string;
  mots_cles_exemples: string;
  url: string;
}

// ── GET : poignée de main de vérification Meta ──

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.FB_WEBHOOK_VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: "Verification failed" }, { status: 403 });
}

// ── Signature Meta (optionnelle mais recommandée) ──

function isSignatureValid(rawBody: string, header: string | null): boolean {
  const secret = process.env.FB_APP_SECRET;
  if (!secret) return true; // pas de secret configuré → on ne bloque pas
  if (!header?.startsWith("sha256=")) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const received = header.slice("sha256=".length);
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(received, "hex"));
  } catch {
    return false;
  }
}

// ── Classification : quel PDF ce commentaire demande-t-il ? ──

/** Fast-path sans IA : le commentaire contient tel quel un mot-clé du catalogue. */
function directMatch(text: string, ressources: Ressource[]): Ressource | null {
  const normalized = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  for (const r of ressources) {
    const re = new RegExp(`(^|[^a-z0-9])${r.slug}($|[^a-z0-9])`, "i");
    if (re.test(normalized)) return r;
  }
  return null;
}

async function classifyWithClaude(
  text: string,
  ressources: Ressource[]
): Promise<Ressource | null> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const catalog = ressources
    .map((r) => `- slug "${r.slug}" : ${r.titre}. Formulations typiques : ${r.mots_cles_exemples}`)
    .join("\n");

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 16,
    system:
      "Tu classifies des commentaires Facebook sous les Reels d'un créateur van aménagé. " +
      "Les spectateurs commentent un mot-clé (parfois mal orthographié ou dans une phrase) " +
      "pour recevoir un PDF gratuit. Réponds UNIQUEMENT avec le slug de la ressource demandée, " +
      "ou exactement `aucune` si le commentaire ne demande clairement aucune de ces ressources. " +
      "Dans le doute (simple compliment, question sans rapport), réponds `aucune`.",
    messages: [
      {
        role: "user",
        content: `Ressources disponibles :\n${catalog}\n\nCommentaire : « ${text.slice(0, 500)} »`,
      },
    ],
  });

  const block = response.content.find((b) => b.type === "text");
  const slug = (block?.type === "text" ? block.text : "").trim().toLowerCase();
  return ressources.find((r) => r.slug === slug) ?? null;
}

// ── Private Reply Messenger avec bouton ──

async function sendPrivateReply(commentId: string, ressource: Ressource, firstName: string | null) {
  const pageId = process.env.FB_PAGE_ID;
  const token = process.env.FB_PAGE_ACCESS_TOKEN;
  if (!pageId || !token) throw new Error("FB_PAGE_ID / FB_PAGE_ACCESS_TOKEN manquants");

  const hello = firstName ? `Salut ${firstName} !` : "Salut !";
  const res = await fetch(`${GRAPH}/${pageId}/messages?access_token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { comment_id: commentId },
      message: {
        attachment: {
          type: "template",
          payload: {
            template_type: "button",
            text: `${hello} Merci pour ton commentaire 🙌 Voici ta ressource comme promis : ${ressource.titre}.`,
            buttons: [
              { type: "web_url", url: ressource.url, title: "📄 Recevoir mon PDF" },
            ],
          },
        },
      },
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Graph API ${res.status}: ${detail.slice(0, 300)}`);
  }
}

// ── POST : événements de commentaires ──

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  if (!isSignatureValid(rawBody, req.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  let body: WebhookBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (body.object !== "page") return NextResponse.json({ ok: true, action: "ignored" });

  const supabase = createSupabaseAdmin();
  const pageId = process.env.FB_PAGE_ID;

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const v = change.value;
      if (change.field !== "feed" || v?.item !== "comment" || v.verb !== "add") continue;
      if (!v.comment_id || !v.message) continue;
      // Ne jamais répondre aux commentaires de la Page elle-même (boucle infinie)
      if (v.from?.id && pageId && v.from.id === pageId) continue;

      // Idempotence : réserve le comment_id ; s'il existe déjà, un autre
      // livreur du même événement l'a déjà pris en charge.
      const { error: insertError } = await supabase.from("fb_webhook_events").insert({
        comment_id: v.comment_id,
        commenter_name: v.from?.name ?? null,
        comment_text: v.message.slice(0, 1000),
      });
      if (insertError) {
        if (insertError.code !== "23505") {
          console.error("[fb-webhook] Insert error:", insertError);
        }
        continue; // doublon (23505) ou erreur DB → on ne risque pas le double DM
      }

      try {
        const { data: ressources, error } = await supabase
          .from("ressources")
          .select("slug, titre, mots_cles_exemples, url")
          .eq("actif", true);
        if (error || !ressources?.length) throw new Error(`Catalogue illisible: ${error?.message}`);

        const match =
          directMatch(v.message, ressources) ??
          (await classifyWithClaude(v.message, ressources));

        if (!match) {
          console.log(`[fb-webhook] ${v.comment_id} → aucune ressource`);
          continue;
        }

        const firstName = v.from?.name?.split(" ")[0] ?? null;
        await sendPrivateReply(v.comment_id, match, firstName);
        await supabase
          .from("fb_webhook_events")
          .update({ ressource_slug: match.slug, dm_sent: true })
          .eq("comment_id", v.comment_id);
        console.log(`[fb-webhook] ${v.comment_id} → DM "${match.slug}" envoyé`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`[fb-webhook] ${v.comment_id} → échec:`, message);
        await supabase
          .from("fb_webhook_events")
          .update({ error: message.slice(0, 500) })
          .eq("comment_id", v.comment_id);
      }
    }
  }

  // Toujours 200 rapidement : Meta ré-essaie sinon, et on a déjà journalisé les échecs
  return NextResponse.json({ ok: true });
}
