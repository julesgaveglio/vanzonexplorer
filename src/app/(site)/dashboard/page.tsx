import { auth, currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { GraduationCap } from "lucide-react";
import { VSL_URL } from "@/lib/constants/vsl";
import ProfileTab from "./ProfileTab";

export default async function DashboardPage() {
  const { userId } = await auth();

  // Non connecté → page d'information
  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="glass-card max-w-lg w-full p-10 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{
              background: "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)",
            }}
          >
            <GraduationCap className="w-8 h-8 text-white" />
          </div>

          <h1
            className="text-2xl font-bold mb-3 bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)",
            }}
          >
            Espace Membre
          </h1>

          <p className="text-slate-600 mb-2 text-sm leading-relaxed">
            L&apos;espace membre est exclusivement réservé aux élèves qui
            rejoignent notre programme d&apos;accompagnement Van Business Academy.
          </p>
          <p className="text-slate-400 text-xs mb-8">
            Formation complète pour lancer et rentabiliser votre activité de
            location de van aménagé. 6 modules, 50+ vidéos, toute notre méthode
            étape par étape.
          </p>

          <Link
            href={VSL_URL}
            className="btn-gold inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold text-white transition-all"
          >
            En savoir plus
          </Link>
        </div>
      </div>
    );
  }

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress ?? "";
  const name = user?.fullName ?? user?.firstName ?? "";

  const supabase = createSupabaseAdmin();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("clerk_id", userId)
    .single();

  return (
    <ProfileTab
      profile={profile}
      clerkId={userId}
      userEmail={email}
      userName={name}
    />
  );
}
