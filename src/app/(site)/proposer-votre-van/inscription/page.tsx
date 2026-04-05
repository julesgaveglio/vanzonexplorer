import type { Metadata } from "next";
import VanOnboardingWizard from "../_components/VanOnboardingWizard";

export const metadata: Metadata = {
  title: "Inscription propriétaire | Vanzon Explorer",
  description:
    "Créez votre fiche van en quelques minutes. 0% de commission pendant le lancement, trafic organique qualifié, aucune exclusivité.",
  alternates: { canonical: "https://vanzonexplorer.com/proposer-votre-van/inscription" },
};

export default function InscriptionPage() {
  return (
    <section className="py-20 bg-white min-h-screen">
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-10">
          <span
            className="badge-glass !px-4 !py-1.5 text-sm font-semibold mb-5 inline-block"
            style={{ color: "#4D5FEC" }}
          >
            Créer votre fiche
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-3 leading-tight">
            Ajoutez votre van en quelques minutes.
          </h1>
          <p className="text-slate-500 text-lg leading-relaxed">
            Remplissez les informations, ajoutez vos photos — on s&apos;occupe du reste.
            Aucun engagement, 0% de commission pendant le lancement.
          </p>
        </div>

        <VanOnboardingWizard />
      </div>
    </section>
  );
}
