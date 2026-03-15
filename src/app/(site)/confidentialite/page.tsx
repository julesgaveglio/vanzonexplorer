import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité | Vanzon Explorer",
  description: "Politique de confidentialité et protection des données personnelles — Vanzon Explorer.",
  robots: { index: false, follow: false },
};

export default function ConfidentialitePage() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        <div className="glass-card p-10">
          <h1 className="text-3xl font-black text-slate-900 mb-2">Politique de confidentialité</h1>
          <p className="text-sm text-slate-400 mb-10">Conformément au Règlement Général sur la Protection des Données (RGPD — UE 2016/679). Dernière mise à jour : mars 2026.</p>

          <div className="prose prose-slate max-w-none space-y-10">
            {/* Responsable */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">1. Responsable du traitement</h2>
              <p className="text-slate-600 leading-relaxed">
                <strong>Vanzon Explorer</strong> — Jules Gaveglio<br />
                Bayonne, 64100 — France<br />
                E-mail : <a href="mailto:contact@vanzonexplorer.com" className="text-accent-blue hover:underline">contact@vanzonexplorer.com</a>
              </p>
            </div>

            {/* Données collectées */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">2. Données collectées</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Nous collectons uniquement les données nécessaires au bon fonctionnement du service :
              </p>
              <ul className="text-slate-600 space-y-2 list-none pl-0">
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span><strong>Authentification (Clerk) :</strong> adresse e-mail, nom, identifiant unique. Ces données permettent la création et la gestion de votre compte utilisateur.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span><strong>Profil utilisateur (Supabase) :</strong> identifiant Clerk, plan d&apos;abonnement, préférences de profil, produits sauvegardés.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span><strong>Paiement (Stripe) :</strong> les paiements liés au Club Privé sont traités par Stripe. Vanzon Explorer ne stocke aucune donnée bancaire. Seul un identifiant client Stripe est conservé pour la gestion de l&apos;abonnement.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span><strong>Analytics (Google Analytics 4) :</strong> données de navigation anonymisées (pages visitées, durée de session, provenance). L&apos;IP est anonymisée. Chargé uniquement après consentement explicite.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span><strong>Service de réservation externe (Yescapa) :</strong> les réservations de vans transitent via la plateforme Yescapa, soumise à sa propre politique de confidentialité.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span><strong>Distribution de contenu (Pinterest) :</strong> les articles publiés sur ce site sont automatiquement partagés sur Pinterest via l&apos;API officielle Pinterest. Aucune donnée utilisateur n&apos;est transmise à Pinterest dans ce processus — seul le contenu éditorial public (titre, image, lien) est utilisé.</span>
                </li>
              </ul>
            </div>

            {/* Finalités */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">3. Finalités du traitement</h2>
              <ul className="text-slate-600 space-y-2 list-none pl-0">
                <li className="flex gap-3"><span className="text-accent-blue font-bold mt-0.5">—</span><span>Gestion des comptes utilisateurs et authentification</span></li>
                <li className="flex gap-3"><span className="text-accent-blue font-bold mt-0.5">—</span><span>Gestion des abonnements Club Privé et traitement des paiements</span></li>
                <li className="flex gap-3"><span className="text-accent-blue font-bold mt-0.5">—</span><span>Traitement des demandes de contact et devis formation</span></li>
                <li className="flex gap-3"><span className="text-accent-blue font-bold mt-0.5">—</span><span>Distribution automatique du contenu éditorial sur Pinterest</span></li>
                <li className="flex gap-3"><span className="text-accent-blue font-bold mt-0.5">—</span><span>Amélioration de l&apos;expérience utilisateur</span></li>
                <li className="flex gap-3"><span className="text-accent-blue font-bold mt-0.5">—</span><span>Statistiques d&apos;utilisation anonymes</span></li>
              </ul>
            </div>

            {/* Conservation */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">4. Durée de conservation</h2>
              <p className="text-slate-600 leading-relaxed">
                Les données personnelles sont conservées pendant la durée nécessaire à la réalisation des finalités pour lesquelles elles ont été collectées, et au maximum 3 ans après le dernier contact. Les données de compte sont conservées jusqu&apos;à la suppression du compte.
              </p>
            </div>

            {/* Droits RGPD */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">5. Vos droits RGPD</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Conformément au RGPD, vous disposez des droits suivants sur vos données personnelles :
              </p>
              <ul className="text-slate-600 space-y-2 list-none pl-0">
                <li className="flex gap-3"><span className="text-accent-blue font-bold mt-0.5">—</span><span><strong>Droit d&apos;accès :</strong> obtenir une copie de vos données</span></li>
                <li className="flex gap-3"><span className="text-accent-blue font-bold mt-0.5">—</span><span><strong>Droit de rectification :</strong> corriger des données inexactes</span></li>
                <li className="flex gap-3"><span className="text-accent-blue font-bold mt-0.5">—</span><span><strong>Droit à l&apos;effacement :</strong> demander la suppression de vos données</span></li>
                <li className="flex gap-3"><span className="text-accent-blue font-bold mt-0.5">—</span><span><strong>Droit d&apos;opposition :</strong> vous opposer au traitement de vos données</span></li>
                <li className="flex gap-3"><span className="text-accent-blue font-bold mt-0.5">—</span><span><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré</span></li>
              </ul>
              <p className="text-slate-600 leading-relaxed mt-4">
                Pour exercer ces droits, contactez-nous à :{" "}
                <a href="mailto:contact@vanzonexplorer.com" className="text-accent-blue hover:underline">
                  contact@vanzonexplorer.com
                </a>
              </p>
            </div>

            {/* Cookies */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">6. Cookies</h2>
              <p className="text-slate-600 leading-relaxed mb-3">
                Ce site utilise deux types de cookies :
              </p>
              <ul className="text-slate-600 space-y-2 list-none pl-0">
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span><strong>Cookies techniques (essentiels) :</strong> nécessaires au fonctionnement de l&apos;authentification (Clerk) et à la session utilisateur. Ils ne peuvent pas être refusés.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span><strong>Cookies d&apos;analyse (Google Analytics 4) :</strong> chargés uniquement après votre consentement explicite. Vous pouvez refuser via la bannière cookie ou retirer votre consentement à tout moment en vidant le stockage local de votre navigateur.</span>
                </li>
              </ul>
            </div>

            {/* Services tiers */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">7. Services tiers</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Vanzon Explorer utilise les services tiers suivants, chacun disposant de sa propre politique de confidentialité :
              </p>
              <ul className="text-slate-600 space-y-2 list-none pl-0">
                <li className="flex gap-3"><span className="text-accent-blue font-bold mt-0.5">—</span><span><strong>Clerk</strong> (auth) — <a href="https://clerk.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">clerk.com/privacy</a></span></li>
                <li className="flex gap-3"><span className="text-accent-blue font-bold mt-0.5">—</span><span><strong>Stripe</strong> (paiement) — <a href="https://stripe.com/fr/privacy" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">stripe.com/fr/privacy</a></span></li>
                <li className="flex gap-3"><span className="text-accent-blue font-bold mt-0.5">—</span><span><strong>Yescapa</strong> (réservation) — <a href="https://www.yescapa.fr/fr/politique-de-confidentialite" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">yescapa.fr/politique-de-confidentialite</a></span></li>
                <li className="flex gap-3"><span className="text-accent-blue font-bold mt-0.5">—</span><span><strong>Pinterest</strong> (distribution contenu) — <a href="https://policy.pinterest.com/fr/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">policy.pinterest.com/fr/privacy-policy</a></span></li>
                <li className="flex gap-3"><span className="text-accent-blue font-bold mt-0.5">—</span><span><strong>Google Analytics 4</strong> (analytics) — <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">policies.google.com/privacy</a></span></li>
                <li className="flex gap-3"><span className="text-accent-blue font-bold mt-0.5">—</span><span><strong>Supabase</strong> (base de données) — <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent-blue hover:underline">supabase.com/privacy</a></span></li>
              </ul>
            </div>

            {/* Réclamation */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">8. Réclamation</h2>
              <p className="text-slate-600 leading-relaxed">
                Si vous estimez que le traitement de vos données n&apos;est pas conforme à la réglementation, vous pouvez introduire une réclamation auprès de la <strong>CNIL</strong> (Commission Nationale de l&apos;Informatique et des Libertés) — cnil.fr.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
