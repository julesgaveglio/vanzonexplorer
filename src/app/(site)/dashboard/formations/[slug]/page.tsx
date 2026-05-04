import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import FormationPaywall from "./_components/FormationPaywall";

const ADMIN_EMAIL = "gavegliojules@gmail.com";

export default async function FormationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  const supabase = createSupabaseAdmin();

  // Fetch formation
  const { data: formation } = await supabase
    .from("formations")
    .select("id, name, slug, description, price_cents, emoji")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!formation) notFound();

  // Check access: admin OR formation_access
  let hasAccess = email === ADMIN_EMAIL;

  if (!hasAccess) {
    const { data: access } = await supabase
      .from("formation_access")
      .select("id")
      .eq("clerk_id", userId)
      .eq("formation_id", formation.id)
      .single();
    if (access) hasAccess = true;
  }

  if (!hasAccess) {
    return (
      <FormationPaywall
        formationName={formation.name}
        formationSlug={formation.slug}
        description={formation.description || ""}
        priceCents={formation.price_cents}
        emoji={formation.emoji || "🎓"}
      />
    );
  }

  // User has access → redirect to first unlocked lesson
  const { data: fmRows } = await supabase
    .from("formation_modules")
    .select("module_id, is_locked")
    .eq("formation_id", formation.id)
    .eq("is_locked", false)
    .order("display_order")
    .limit(1);

  const firstModuleId = fmRows?.[0]?.module_id;
  if (!firstModuleId) notFound();

  // Get module slug + first lesson slug
  const [moduleRes, lessonRes] = await Promise.all([
    supabase
      .from("vba_modules")
      .select("slug")
      .eq("id", firstModuleId)
      .single(),
    supabase
      .from("vba_lessons")
      .select("slug")
      .eq("module_id", firstModuleId)
      .eq("is_published", true)
      .order("order")
      .limit(1),
  ]);

  const moduleSlug = moduleRes.data?.slug;
  const lessonSlug = lessonRes.data?.[0]?.slug;

  if (!moduleSlug || !lessonSlug) notFound();

  redirect(`/dashboard/formations/${slug}/${moduleSlug}/${lessonSlug}`);
}
