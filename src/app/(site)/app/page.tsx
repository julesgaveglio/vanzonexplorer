import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Application Vanzon Explorer",
  robots: { index: false, follow: false },
};

export default function AppInfoPage() {
  return (
    <section className="min-h-[60vh] max-w-2xl mx-auto px-6 py-20">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        Vanzon Explorer — Application
      </h1>

      <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
        <p>
          <strong>Vanzon Explorer</strong> est une plateforme de location de
          vans aménagés au Pays Basque et un programme de formation (Van
          Business Academy) pour accompagner les particuliers dans la création
          de leur activité de location de van.
        </p>

        <h2 className="text-lg font-semibold text-slate-900 pt-4">
          Utilisation des services Google
        </h2>
        <p>
          Notre application utilise l&apos;API Gmail pour envoyer des emails
          transactionnels et de suivi à nos utilisateurs inscrits :
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Emails de bienvenue après inscription</li>
          <li>Séquences de suivi pour les leads du tunnel de vente</li>
          <li>Communications liées aux formations et accompagnements</li>
          <li>Notifications de réservation et confirmations</li>
        </ul>

        <p>
          Les données accessibles via l&apos;API Gmail (envoi et lecture
          d&apos;emails) sont utilisées exclusivement pour le fonctionnement
          de la plateforme Vanzon Explorer. Aucune donnée n&apos;est partagée
          avec des tiers.
        </p>

        <h2 className="text-lg font-semibold text-slate-900 pt-4">
          Politique de confidentialité
        </h2>
        <p>
          Consultez notre{" "}
          <Link
            href="/confidentialite"
            className="text-blue-600 hover:underline"
          >
            politique de confidentialité
          </Link>{" "}
          pour plus d&apos;informations sur le traitement de vos données.
        </p>

        <h2 className="text-lg font-semibold text-slate-900 pt-4">
          Contact
        </h2>
        <p>
          Pour toute question :{" "}
          <a
            href="mailto:contact@vanzonexplorer.com"
            className="text-blue-600 hover:underline"
          >
            contact@vanzonexplorer.com
          </a>
        </p>
      </div>
    </section>
  );
}
