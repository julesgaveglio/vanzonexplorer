import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { Lock, ChevronRight } from "lucide-react";

export const metadata = {
  title: "Mes annonces — Vanzon Explorer",
  robots: { index: false, follow: false },
};

const ADMIN_EMAILS = ["gavegliojules@gmail.com", "vanzonexplorer@gmail.com"];

export default async function AnnoncesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  const isAdmin = !!email && ADMIN_EMAILS.includes(email);

  const supabase = createSupabaseAdmin();
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("clerk_id", userId)
    .single();

  const hasVBA = isAdmin || profile?.plan === "vba_member";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Titre */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Mes annonces</h1>
        <p className="text-sm text-slate-500 mt-1">
          Publiez votre van sur Vanzon Explorer et profitez de notre
          référencement pour attirer des locataires.
        </p>
      </div>

      {/* Explication */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Comment ça fonctionne</h2>

        <div className="space-y-3 text-sm text-slate-600">
          <p>
            En tant que membre de la Van Business Academy, vous pouvez publier
            votre van sur notre site. Votre annonce devient une page dédiée
            qui redirige les visiteurs vers votre plateforme de réservation
            (Yescapa, Wikicampers).
          </p>
          <p>
            Pas besoin de gérer l&apos;assurance — c&apos;est la plateforme
            de réservation qui s&apos;en charge. Vanzon Explorer est
            uniquement une couche de visibilité supplémentaire.
          </p>
          <p>
            Une fois votre annonce validée par notre équipe, une intelligence
            artificielle crée des articles de blog ciblant les voyageurs
            intéressés par votre région en van aménagé. L&apos;objectif :
            optimiser votre taux d&apos;occupation grâce au référencement
            naturel.
          </p>
        </div>
      </div>

      {/* CTA */}
      {hasVBA ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center">
          <p className="text-sm text-slate-600 mb-4">
            Déposez votre premier van et profitez de notre référencement.
          </p>
          <Link
            href="/proprietaire/inscription"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
            style={{
              background:
                "linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%)",
            }}
          >
            Déposer mon van
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 text-center">
          <Lock className="w-5 h-5 text-slate-400 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700 mb-1">
            Réservé aux membres Van Business Academy
          </p>
          <p className="text-xs text-slate-500 mb-4">
            La publication d&apos;annonces est incluse dans
            l&apos;accompagnement complet.
          </p>
          <Link
            href="/van-business-academy/presentation"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
            style={{
              background:
                "linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%)",
            }}
          >
            En savoir plus
          </Link>
        </div>
      )}
    </div>
  );
}
