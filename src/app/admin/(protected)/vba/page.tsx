import { createSupabaseAdmin } from "@/lib/supabase/server";
import VBAModulesClient from "./_components/VBAModulesClient";

export default async function AdminVBAPage() {
  const supabase = createSupabaseAdmin();
  const { data } = await supabase
    .from("vba_modules")
    .select("*, vba_lessons(id)")
    .order("order");

  const modules = (data ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    slug: m.slug,
    description: m.description,
    order: m.order,
    is_published: m.is_published,
    lesson_count: m.vba_lessons?.length ?? 0,
    created_at: m.created_at,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Van Business Academy
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Gérer les modules et leçons de la formation
          </p>
        </div>
      </div>

      <VBAModulesClient initialModules={modules} />
    </div>
  );
}
