// src/app/admin/(protected)/seo/editeur/page.tsx
import { createSupabaseAdmin } from "@/lib/supabase/server";
import DraftsListClient from "./_components/DraftsListClient";

export const dynamic = "force-dynamic";

export default async function EditeurPage() {
  const supabase = createSupabaseAdmin();
  const { data: drafts } = await supabase
    .from("draft_articles")
    .select("id, title, excerpt, target_url, status, created_at, updated_at")
    .order("created_at", { ascending: false });

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Éditeur de texte</h1>
        <p className="text-sm text-slate-500 mt-1">
          Brouillons d&apos;articles — modifiez, envoyez par email ou validez pour la file de publication.
        </p>
      </div>
      <DraftsListClient initialDrafts={drafts ?? []} />
    </div>
  );
}
