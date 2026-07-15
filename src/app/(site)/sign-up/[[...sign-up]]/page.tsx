import type { Metadata } from "next";
import Link from "next/link";
import LiquidButton from "@/components/ui/LiquidButton";

export const metadata: Metadata = {
  title: "Rejoindre la Van Business Academy",
  robots: { index: false, follow: false },
};

// La VBA n'est pas en libre-service : l'inscription se fait sur appel
// diagnostic, pour vérifier le projet et le profil avant d'accompagner
// quelqu'un. Remplace l'ancien formulaire Clerk auto-serve.
export default function SignUpPage() {
  return (
    <section
      className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-20 px-4"
      style={{ background: "linear-gradient(160deg, #FFFFFF 0%, #FAF6F0 60%, #F5EDE5 100%)" }}
    >
      <div className="w-full max-w-lg text-center">
        <span
          className="inline-flex items-center gap-2 badge-glass !px-5 !py-2 text-sm font-medium mb-8"
          style={{
            background: "rgba(205,167,123,0.12)",
            border: "1px solid rgba(205,167,123,0.35)",
            color: "#B9945F",
          }}
        >
          Van Business Academy
        </span>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight mb-4">
          L&apos;accès se fait sur appel diagnostic.
        </h1>

        <p className="text-slate-600 text-base leading-relaxed mb-8 max-w-md mx-auto">
          Pas d&apos;inscription en libre-service : avant de rejoindre
          l&apos;accompagnement, on échange 15 minutes pour parler de ton
          projet, définir tes objectifs, et vérifier ensemble que ton profil
          correspond à ce qu&apos;on peut réellement t&apos;apporter.
        </p>

        <div className="flex flex-col items-center gap-4">
          <LiquidButton
            variant="gold"
            size="lg"
            href="/van-business-academy/diagnostic-offert"
            fullWidth
          >
            Réserver mon appel diagnostic →
          </LiquidButton>

          <Link
            href="/van-business-academy/presentation"
            className="text-sm text-slate-500 hover:text-slate-700 underline underline-offset-2 transition-colors"
          >
            Je préfère d&apos;abord découvrir le programme
          </Link>
        </div>

        <p className="text-sm text-slate-400 mt-10">
          Déjà accompagné(e) ?{" "}
          <Link href="/sign-in" className="text-slate-600 font-medium hover:underline">
            Se connecter à l&apos;espace membre
          </Link>
        </p>
      </div>
    </section>
  );
}
