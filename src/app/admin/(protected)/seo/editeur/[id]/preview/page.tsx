// src/app/admin/(protected)/seo/editeur/[id]/preview/page.tsx
// Aperçu de l'article avec le design Vanzon Explorer avant publication
import { notFound } from "next/navigation";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import ArticlePreviewClient from "./_components/ArticlePreviewClient";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export default async function PreviewPage({ params }: Props) {
  const supabase = createSupabaseAdmin();
  const { data: draft } = await supabase
    .from("draft_articles")
    .select("id, title, excerpt, html_content, target_url, status")
    .eq("id", params.id)
    .single();

  if (!draft) notFound();

  return <ArticlePreviewClient draft={draft} />;
}
