import { createSupabaseAdmin } from "@/lib/supabase/server";
import AdminPageHeader from "@/app/admin/_components/ui/AdminPageHeader";
import FormationAccessClient from "./_components/FormationAccessClient";

export default async function FormationAccessPage() {
  const supabase = createSupabaseAdmin();

  // Fetch all formations
  const { data: formations } = await supabase
    .from("formations")
    .select("id, name, slug, emoji, price_cents, is_published")
    .order("created_at");

  // Fetch all access entries with user info
  const { data: accessRows } = await supabase
    .from("formation_access")
    .select("id, clerk_id, formation_id, created_at")
    .order("created_at", { ascending: false });

  // Fetch profiles for these users
  const clerkIds = Array.from(new Set((accessRows ?? []).map((a) => a.clerk_id)));
  const { data: profiles } = clerkIds.length > 0
    ? await supabase
        .from("profiles")
        .select("clerk_id, email, full_name, plan")
        .in("clerk_id", clerkIds)
    : { data: [] };

  // Fetch VBA members too
  const { data: vbaMembers } = await supabase
    .from("profiles")
    .select("clerk_id, email, full_name, plan")
    .eq("plan", "vba_member");

  // Fetch progress for all users with formation access
  const allUserIds = Array.from(new Set([
    ...clerkIds,
    ...(vbaMembers ?? []).map((m) => m.clerk_id),
  ]));

  const { data: progress } = allUserIds.length > 0
    ? await supabase
        .from("vba_progress")
        .select("user_id, lesson_id, completed, completed_at")
        .in("user_id", allUserIds)
    : { data: [] };

  // Fetch all modules + lessons for context
  const [modulesRes, lessonsRes] = await Promise.all([
    supabase
      .from("vba_modules")
      .select("id, title, slug, order")
      .eq("is_published", true)
      .order("order"),
    supabase
      .from("vba_lessons")
      .select("id, module_id, title, slug, order, duration_seconds")
      .eq("is_published", true)
      .order("order"),
  ]);

  // Fetch formation_modules mapping
  const { data: formationModules } = await supabase
    .from("formation_modules")
    .select("formation_id, module_id, display_order, is_locked");

  // Fetch promo codes
  const { data: promoCodes } = await supabase
    .from("promo_codes")
    .select("id, code, formation_id, discount_percent, is_active, uses_count, max_uses");

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Accès Formations"
        subtitle="Suivi des utilisateurs et progression par formation"
      />
      <FormationAccessClient
        formations={formations ?? []}
        accessRows={accessRows ?? []}
        profiles={profiles ?? []}
        vbaMembers={vbaMembers ?? []}
        progress={progress ?? []}
        modules={modulesRes.data ?? []}
        lessons={lessonsRes.data ?? []}
        formationModules={formationModules ?? []}
        promoCodes={promoCodes ?? []}
      />
    </div>
  );
}
