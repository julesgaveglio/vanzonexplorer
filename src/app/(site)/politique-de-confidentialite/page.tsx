import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Vanzon Explorer",
};

export default function PrivacyPolicyPage() {
  return (
    <section className="max-w-2xl mx-auto px-6 py-20">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">
        Politique de confidentialité
      </h1>

      <div className="space-y-6 text-sm text-slate-600 leading-relaxed">
        <p>
          Dernière mise à jour : mai 2026
        </p>

        <h2 className="text-lg font-semibold text-slate-900">
          1. Responsable du traitement
        </h2>
        <p>
          Vanzon Explorer — SAS au capital variable<br />
          Email : contact@vanzonexplorer.com<br />
          Site : vanzonexplorer.com
        </p>

        <h2 className="text-lg font-semibold text-slate-900">
          2. Données collectées
        </h2>
        <p>Nous collectons les données suivantes :</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Nom, prénom et adresse email (formulaires d&apos;inscription)</li>
          <li>Données de navigation (cookies analytics)</li>
          <li>Données de progression (formations en ligne)</li>
          <li>Informations de paiement (traitées par Stripe, non stockées sur nos serveurs)</li>
        </ul>

        <h2 className="text-lg font-semibold text-slate-900">
          3. Utilisation des données
        </h2>
        <p>Vos données sont utilisées pour :</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Vous fournir l&apos;accès aux formations et services souscrits</li>
          <li>Vous envoyer des emails transactionnels et de suivi liés à votre inscription</li>
          <li>Améliorer nos services et votre expérience utilisateur</li>
          <li>Répondre à vos demandes de contact</li>
        </ul>

        <h2 className="text-lg font-semibold text-slate-900">
          4. Utilisation de l&apos;API Google
        </h2>
        <p>
          Notre application utilise l&apos;API Gmail pour l&apos;envoi
          d&apos;emails depuis notre domaine vanzonexplorer.com.
          L&apos;utilisation et le transfert d&apos;informations reçues des
          API Google par Vanzon Explorer respectent la{" "}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Politique de données utilisateur des services API Google
          </a>
          , y compris les exigences d&apos;utilisation limitée.
        </p>

        <h2 className="text-lg font-semibold text-slate-900">
          5. Partage des données
        </h2>
        <p>
          Vos données personnelles ne sont pas vendues ni partagées avec des
          tiers à des fins commerciales. Elles peuvent être transmises à nos
          sous-traitants techniques (hébergement, envoi d&apos;emails, paiement)
          dans le cadre strict de la fourniture de nos services.
        </p>

        <h2 className="text-lg font-semibold text-slate-900">
          6. Conservation
        </h2>
        <p>
          Vos données sont conservées pendant la durée de votre utilisation de
          nos services, puis supprimées dans un délai de 3 ans après votre
          dernière activité.
        </p>

        <h2 className="text-lg font-semibold text-slate-900">
          7. Vos droits
        </h2>
        <p>
          Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de
          rectification, de suppression et de portabilité de vos données. Pour
          exercer ces droits, contactez-nous à{" "}
          <a
            href="mailto:contact@vanzonexplorer.com"
            className="text-blue-600 hover:underline"
          >
            contact@vanzonexplorer.com
          </a>
          .
        </p>

        <h2 className="text-lg font-semibold text-slate-900">
          8. Contact
        </h2>
        <p>
          Pour toute question relative à cette politique :{" "}
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
