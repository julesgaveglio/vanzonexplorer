// src/app/api/admin/seo/drafts/[id]/queue/route.ts
// Valide un brouillon → l'insère dans article_queue + met à jour son statut
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

// Extrait le premier texte visible d'un HTML
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createSupabaseAdmin();

  // 1. Récupérer le brouillon
  const { data: draft, error: fetchErr } = await supabase
    .from("draft_articles")
    .select("*")
    .eq("id", params.id)
    .single();

  if (fetchErr || !draft) {
    return NextResponse.json({ error: "Brouillon introuvable" }, { status: 404 });
  }

  if (draft.status === "queued") {
    return NextResponse.json({ error: "Déjà en file d'attente" }, { status: 400 });
  }

  const slug = slugify(draft.title) || `draft-${Date.now()}`;
  const excerpt = draft.excerpt || stripHtml(draft.html_content).slice(0, 160);

  // 2. Insérer dans article_queue
  const { error: queueErr } = await supabase.from("article_queue").insert({
    slug,
    title:           draft.title,
    excerpt,
    category:        "Backlink",
    tag:             null,
    read_time:       "5 min",
    target_keyword:  draft.title,
    secondary_keywords: [],
    target_word_count: 1000,
    word_count_note: `Article pré-rédigé depuis l'éditeur. Contenu source disponible dans draft_articles id=${draft.id}. URL cible : ${draft.target_url || "(aucune)"}`,
    status:          "pending",
    priority:        80,
    added_by:        "editeur-admin",
  });

  if (queueErr) {
    return NextResponse.json({ error: queueErr.message }, { status: 500 });
  }

  // 3. Mettre à jour le statut du brouillon
  await supabase
    .from("draft_articles")
    .update({ status: "queued" })
    .eq("id", params.id);

  return NextResponse.json({ ok: true, slug });
}
