import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import VBALessonsClient from "./_components/VBALessonsClient";

export default async function AdminModuleLessonsPage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  const supabase = createSupabaseAdmin();

  const { data: mod } = await supabase
    .from("vba_modules")
    .select("*")
    .eq("id", moduleId)
    .single();

  if (!mod) notFound();

  const { data: lessons } = await supabase
    .from("vba_lessons")
    .select("*")
    .eq("module_id", moduleId)
    .order("order");

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/vba"
          className="text-sm text-slate-500 hover:text-blue-600 transition-colors mb-2 inline-block"
        >
          ← Tous les modules
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">{mod.title}</h1>
        {mod.description && (
          <p className="text-sm text-slate-500 mt-1">{mod.description}</p>
        )}
      </div>

      <VBALessonsClient
        moduleId={moduleId}
        initialLessons={lessons ?? []}
      />
    </div>
  );
}
