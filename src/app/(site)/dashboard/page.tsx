import type { Metadata } from "next";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import DashboardTabs from "./DashboardTabs";

export const metadata: Metadata = {
  title: "Mon espace — Vanzon Explorer",
  description: "Gérez votre profil, vos deals sauvegardés et vos locations.",
  robots: { index: false, follow: false },
};

async function getOrCreateProfile(clerkId: string, email: string, name: string, avatar: string) {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      { clerk_id: clerkId, email, full_name: name, avatar_url: avatar },
      { onConflict: "clerk_id", ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) {
    console.error("Profile upsert error:", error.message);
    return null;
  }
  return data;
}

async function getSavedDeals(clerkId: string) {
  const supabase = createSupabaseAdmin();
  const { data } = await supabase
    .from("saved_products")
    .select(`
      id,
      product_id,
      created_at,
      products (
        id, slug, name, promo_price, original_price, discount_percent,
        promo_code, main_image_url, offer_type,
        brands ( name, logo_url )
      )
    `)
    .eq("clerk_id", clerkId)
    .order("created_at", { ascending: false })
    .limit(12);

  // Supabase retourne les relations FK comme tableaux dans les types TS — on caste manuellement
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []) as any[];
}

async function getVans() {
  const supabase = createSupabaseAdmin();
  const { data } = await supabase
    .from("vans_location")
    .select("id, slug, name, model, price_per_night, main_image_url, yescapa_url, features, seats, sleeping_spots")
    .eq("is_active", true)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const fullName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";
  const avatar = user?.imageUrl ?? "";

  const [profile, savedDeals, vans] = await Promise.all([
    getOrCreateProfile(userId, email, fullName, avatar),
    getSavedDeals(userId),
    getVans(),
  ]);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Bonjour" : hour < 18 ? "Bonne journée" : "Bonsoir";

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* ── Header ── */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-slate-100">
              {avatar ? (
                <Image src={avatar} alt={fullName} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center text-white font-bold text-lg">
                  {fullName?.[0] ?? "V"}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">
                {greeting}, {user?.firstName ?? "Explorer"}
              </p>
              <h1 className="text-lg font-bold text-slate-900">Mon espace</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
              profile?.plan === "club_member"
                ? "bg-purple-50 text-purple-700"
                : "bg-slate-100 text-slate-500"
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {profile?.plan === "club_member" ? "Club Privé" : "Compte gratuit"}
            </span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>

      {/* ── Contenu avec tabs ── */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <DashboardTabs
          profile={profile}
          savedDeals={savedDeals}
          vans={vans}
          clerkId={userId}
          userEmail={email}
          userName={fullName}
        />
      </div>
    </div>
  );
}
