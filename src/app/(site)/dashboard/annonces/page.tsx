import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import {
  Lock,
  Globe,
  PenTool,
  TrendingUp,
  ChevronRight,
  Shield,
  Sparkles,
} from "lucide-react";

export const metadata = {
  title: "Mes annonces — Vanzon Explorer",
  robots: { index: false, follow: false },
};

const ADMIN_EMAIL = "gavegliojules@gmail.com";

export default async function AnnoncesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  const isAdmin = email === ADMIN_EMAIL;

  const supabase = createSupabaseAdmin();
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("clerk_id", userId)
    .single();

  const hasVBA = isAdmin || profile?.plan === "vba_member";

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-8 sm:p-10 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(185,148,95,0.15),transparent_60%)]" />
        <div className="relative">
          <span className="text-4xl block mb-4">🚐</span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Publiez votre van sur Vanzon Explorer
          </h1>
          <p className="text-slate-300 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            Profitez de notre référencement SEO pour attirer des locataires
            qualifiés directement vers votre annonce.
          </p>
        </div>
      </div>

      {/* Comment ça marche */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-4">
            <PenTool className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm mb-1.5">
            1. Déposez votre annonce
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Ajoutez votre van avec photos, tarifs et liens de réservation
            vers Yescapa ou Wikicampers.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
            <Sparkles className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm mb-1.5">
            2. Notre IA crée du contenu
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Une intelligence artificielle génère des articles de blog ciblant
            les voyageurs intéressés par votre région en van aménagé.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm mb-1.5">
            3. Taux d&apos;occupation optimisé
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Les articles se positionnent sur Google et redirigent les visiteurs
            vers votre page de réservation.
          </p>
        </div>
      </div>

      {/* Détails */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8">
        <h2 className="font-bold text-slate-900 text-lg mb-4">
          Comment ça fonctionne
        </h2>
        <div className="space-y-4">
          <div className="flex gap-3">
            <Globe className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-slate-700 font-medium">
                Une page dédiée sur vanzonexplorer.com
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Votre van est présenté sur une page optimisée avec vos photos,
                tarifs et équipements. Les visiteurs sont redirigés vers votre
                plateforme de réservation préférée (Yescapa, Wikicampers).
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-slate-700 font-medium">
                Pas d&apos;assurance à gérer
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                L&apos;assurance tous risques est gérée par la plateforme de
                réservation. Vanzon Explorer est une couche d&apos;acquisition —
                on vous apporte la visibilité, les plateformes gèrent le reste.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Sparkles className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-slate-700 font-medium">
                Référencement automatique par IA
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Une fois votre annonce validée, notre intelligence artificielle
                crée une série d&apos;articles SEO pour cibler les voyageurs
                cherchant à visiter votre région en van aménagé. Plus de
                visibilité = meilleur taux d&apos;occupation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      {hasVBA ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 text-center">
          <h3 className="font-bold text-slate-900 text-lg mb-2">
            Prêt à publier votre van ?
          </h3>
          <p className="text-sm text-slate-500 mb-6">
            Déposez votre annonce — notre équipe la valide sous 48h.
          </p>
          <Link
            href="/proprietaire/inscription"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
            style={{
              background:
                "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)",
            }}
          >
            Déposer mon van
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 sm:p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-5 h-5 text-slate-400" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg mb-2">
            Réservé aux membres Van Business Academy
          </h3>
          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
            La publication d&apos;annonces est un avantage exclusif de notre
            programme d&apos;accompagnement complet. Rejoignez la Van Business
            Academy pour en bénéficier.
          </p>
          <Link
            href="/van-business-academy/presentation"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-95"
            style={{
              background:
                "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)",
            }}
          >
            Découvrir la Van Business Academy
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
