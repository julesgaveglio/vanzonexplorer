import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Vanzon Explorer",
  description:
    "Politique de confidentialité et protection des données personnelles — Vanzon Explorer.",
  robots: { index: false, follow: false },
};

export default function ConfidentialitePage() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        <div className="glass-card p-10">
          <h1 className="text-3xl font-black text-slate-900 mb-2">
            Politique de confidentialité
          </h1>
          <p className="text-sm text-slate-400 mb-10">
            Conformément au Règlement Général sur la Protection des Données
            (RGPD — UE 2016/679). Dernière mise à jour : mai 2026.
          </p>

          <div className="prose prose-slate max-w-none space-y-10">
            {/* Responsable */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                1. Responsable du traitement
              </h2>
              <p className="text-slate-600 leading-relaxed">
                <strong>Vanzon Explorer</strong> — SAS au capital variable
                <br />
                Représentant légal : Jules Gaveglio
                <br />
                Cambo-les-Bains, 64250 — France
                <br />
                E-mail :{" "}
                <a
                  href="mailto:contact@vanzonexplorer.com"
                  className="text-accent-blue hover:underline"
                >
                  contact@vanzonexplorer.com
                </a>
              </p>
            </div>

            {/* Données collectées */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                2. Données collectées
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Nous collectons uniquement les données nécessaires au bon
                fonctionnement de nos services :
              </p>
              <ul className="text-slate-600 space-y-2 list-none pl-0">
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span>
                    <strong>Authentification (Clerk) :</strong> adresse e-mail,
                    nom, identifiant unique. Ces données permettent la création
                    et la gestion de votre compte utilisateur.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span>
                    <strong>Profil utilisateur (Supabase) :</strong> identifiant
                    Clerk, plan d&apos;accès (gratuit, membre VBA, accès
                    formation), préférences et progression dans les formations.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span>
                    <strong>Formulaires d&apos;inscription :</strong> prénom,
                    adresse e-mail, données UTM (source de trafic). Collectées
                    lors de l&apos;inscription aux formations ou à la
                    newsletter.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span>
                    <strong>Formations en ligne (Van Business Academy) :</strong>{" "}
                    progression, leçons complétées, pourcentage de visionnage.
                    Les vidéos sont hébergées sur Bunny.net Stream.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span>
                    <strong>Paiement (Stripe) :</strong> les informations de
                    paiement sont traitées directement par Stripe. Nous ne
                    stockons aucune donnée bancaire sur nos serveurs.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span>
                    <strong>Suivi du tunnel de vente :</strong> événements de
                    navigation anonymisés (pages vues, visionnage de vidéo,
                    prises de rendez-vous) pour améliorer l&apos;expérience
                    utilisateur. Tracking via Meta Pixel (avec consentement) et
                    suivi serveur (Supabase).
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span>
                    <strong>Analytics (Google Analytics 4) :</strong> données de
                    navigation anonymisées. L&apos;IP est anonymisée. Chargé
                    uniquement après consentement explicite.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span>
                    <strong>
                      Réservation de vans (Yescapa, Wikicampers) :
                    </strong>{" "}
                    les réservations transitent via ces plateformes externes,
                    soumises à leurs propres politiques de confidentialité.
                  </span>
                </li>
              </ul>
            </div>

            {/* Utilisation API Google */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                3. Utilisation des API Google
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Vanzon Explorer utilise les services Google suivants :
              </p>
              <ul className="text-slate-600 space-y-2 list-none pl-0">
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span>
                    <strong>API Gmail :</strong> envoi d&apos;emails
                    transactionnels et de séquences de suivi depuis notre
                    domaine vanzonexplorer.com (bienvenue, relances, confirmations).
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span>
                    <strong>Google Search Console :</strong> suivi du
                    référencement et de l&apos;indexation du site (données
                    internes, non partagées).
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span>
                    <strong>Google Places API :</strong> récupération des avis
                    Google pour afficher notre note sur le site.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span>
                    <strong>Google PageSpeed Insights :</strong> mesure des
                    performances du site (données internes).
                  </span>
                </li>
              </ul>
              <p className="text-slate-600 leading-relaxed mt-4">
                L&apos;utilisation et le transfert d&apos;informations reçues
                des API Google respectent la{" "}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-blue hover:underline"
                >
                  Politique de données utilisateur des services API Google
                </a>
                , y compris les exigences d&apos;utilisation limitée.
              </p>
            </div>

            {/* Emails */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                4. Emails et communications
              </h2>
              <p className="text-slate-600 leading-relaxed">
                En vous inscrivant sur notre site ou à l&apos;une de nos
                formations, vous acceptez de recevoir des emails
                transactionnels liés à votre inscription (bienvenue, suivi,
                confirmations). Les emails sont envoyés via l&apos;API Gmail
                et Resend depuis les adresses @vanzonexplorer.com. Vous pouvez
                vous désinscrire à tout moment en cliquant sur le lien de
                désinscription présent dans chaque email ou en nous contactant
                directement.
              </p>
            </div>

            {/* Finalités */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                5. Finalités du traitement
              </h2>
              <ul className="text-slate-600 space-y-2 list-none pl-0">
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span>
                    Gestion des comptes utilisateurs et authentification
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span>
                    Accès et suivi de progression dans les formations (Van
                    Business Academy, Homologation VASP)
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span>
                    Traitement des paiements et gestion des codes promotionnels
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span>
                    Envoi d&apos;emails transactionnels et de séquences de suivi
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span>
                    Gestion des annonces de vans (marketplace propriétaires)
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span>
                    Génération d&apos;itinéraires road trip personnalisés
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span>
                    Distribution automatique du contenu éditorial sur Pinterest
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span>
                    Amélioration de l&apos;expérience utilisateur et
                    statistiques anonymes
                  </span>
                </li>
              </ul>
            </div>

            {/* Conservation */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                6. Durée de conservation
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Les données personnelles sont conservées pendant la durée
                nécessaire à la réalisation des finalités pour lesquelles elles
                ont été collectées, et au maximum 3 ans après le dernier
                contact. Les données de compte sont conservées jusqu&apos;à la
                suppression du compte.
              </p>
            </div>

            {/* Droits RGPD */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                7. Vos droits RGPD
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Conformément au RGPD, vous disposez des droits suivants :
              </p>
              <ul className="text-slate-600 space-y-2 list-none pl-0">
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span>
                    <strong>Droit d&apos;accès :</strong> obtenir une copie de
                    vos données
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span>
                    <strong>Droit de rectification :</strong> corriger des
                    données inexactes
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span>
                    <strong>Droit à l&apos;effacement :</strong> demander la
                    suppression de vos données
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span>
                    <strong>Droit d&apos;opposition :</strong> vous opposer au
                    traitement de vos données
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span>
                    <strong>Droit à la portabilité :</strong> recevoir vos
                    données dans un format structuré
                  </span>
                </li>
              </ul>
              <p className="text-slate-600 leading-relaxed mt-4">
                Pour exercer ces droits :{" "}
                <a
                  href="mailto:contact@vanzonexplorer.com"
                  className="text-accent-blue hover:underline"
                >
                  contact@vanzonexplorer.com
                </a>
              </p>
            </div>

            {/* Cookies */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                8. Cookies
              </h2>
              <ul className="text-slate-600 space-y-2 list-none pl-0">
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span>
                    <strong>Cookies techniques (essentiels) :</strong>{" "}
                    authentification (Clerk), session utilisateur, préférences.
                    Ne peuvent pas être refusés.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span>
                    <strong>Cookies d&apos;analyse (Google Analytics 4) :</strong>{" "}
                    chargés uniquement après consentement explicite.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span>
                    <strong>Meta Pixel (Facebook) :</strong> suivi de
                    conversion pour les campagnes publicitaires. Activé
                    uniquement avec consentement.
                  </span>
                </li>
              </ul>
            </div>

            {/* Services tiers */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                9. Services tiers
              </h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Vanzon Explorer utilise les services tiers suivants :
              </p>
              <ul className="text-slate-600 space-y-2 list-none pl-0">
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span><strong>Clerk</strong> — authentification</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span><strong>Supabase</strong> — base de données</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span><strong>Stripe</strong> — paiement sécurisé</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span><strong>Vercel</strong> — hébergement</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span><strong>Bunny.net</strong> — hébergement vidéo (formations)</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span><strong>Resend</strong> — envoi d&apos;emails transactionnels</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span><strong>API Gmail</strong> — envoi d&apos;emails et communications</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span><strong>Google Analytics 4</strong> — statistiques anonymes</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span><strong>Meta Pixel</strong> — suivi de conversion publicitaire</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span><strong>Calendly</strong> — prise de rendez-vous</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span><strong>Yescapa / Wikicampers</strong> — réservation de vans</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span><strong>Pinterest</strong> — distribution de contenu éditorial</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span><strong>Sanity</strong> — gestion de contenu (CMS)</span>
                </li>
              </ul>
            </div>

            {/* Réclamation */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                10. Réclamation
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Si vous estimez que le traitement de vos données n&apos;est pas
                conforme à la réglementation, vous pouvez introduire une
                réclamation auprès de la{" "}
                <strong>CNIL</strong> (Commission Nationale de
                l&apos;Informatique et des Libertés) — cnil.fr.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
