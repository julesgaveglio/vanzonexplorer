import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import DashboardNav from "./_components/DashboardNav";

const ADMIN_EMAIL = "gavegliojules@gmail.com";

export const metadata = {
  title: "Mon espace — Vanzon Explorer",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  const isAdmin = email === ADMIN_EMAIL;

  const supabase = createSupabaseAdmin();

  // Fetch VBA access + formation access in parallel
  const [profileRes, formationsRes, accessRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("plan")
      .eq("clerk_id", userId)
      .single(),
    supabase
      .from("formations")
      .select("id, name, slug, emoji")
      .eq("is_published", true)
      .order("created_at"),
    supabase
      .from("formation_access")
      .select("formation_id")
      .eq("clerk_id", userId),
  ]);

  const hasVBA = isAdmin || profileRes.data?.plan === "vba_member";
  const accessSet = new Set(
    (accessRes.data ?? []).map((a) => a.formation_id)
  );

  const formations = (formationsRes.data ?? []).map((f) => ({
    name: f.name,
    slug: f.slug,
    emoji: f.emoji || "📋",
    hasAccess: isAdmin || accessSet.has(f.id),
  }));

  return (
    <section className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <DashboardNav hasVBA={hasVBA} formations={formations} />
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8">{children}</div>
    </section>
  );
}
