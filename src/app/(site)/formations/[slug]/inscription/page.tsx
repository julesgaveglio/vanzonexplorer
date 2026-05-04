import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import FormationSignUp from "./_components/FormationSignUp";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function FormationInscriptionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Already logged in → go straight to formation dashboard
  const { userId } = await auth();
  if (userId) {
    redirect(`/dashboard/formations/${slug}`);
  }

  // Fetch formation for branding
  const supabase = createSupabaseAdmin();
  const { data: formation } = await supabase
    .from("formations")
    .select("name, slug, description, emoji")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!formation) notFound();

  return (
    <FormationSignUp
      formationName={formation.name}
      formationSlug={formation.slug}
      description={formation.description || ""}
      emoji={formation.emoji || "🎓"}
    />
  );
}
