// src/app/admin/(protected)/seo/editeur/[id]/page.tsx
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ArticleEditorClient from "./_components/ArticleEditorClient";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export default async function EditorPage({ params }: Props) {
  const supabase = createSupabaseAdmin();
  const { data: draft, error } = await supabase
    .from("draft_articles")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !draft) notFound();

  return (
    <div className="p-6">
      <ArticleEditorClient draft={draft} />
    </div>
  );
}
