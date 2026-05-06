import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales — Vanzon Explorer",
  description: "Mentions légales du site Vanzon Explorer.",
  robots: { index: false, follow: false },
};

export default function MentionsLegalesPage() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        <div className="glass-card p-10">
          <h1 className="text-3xl font-black text-slate-900 mb-2">
            Mentions légales
          </h1>
          <p className="text-sm text-slate-400 mb-10">
            Conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance
            dans l&apos;économie numérique. Dernière mise à jour : mai 2026.
          </p>

          <div className="prose prose-slate max-w-none space-y-10">
            {/* Éditeur */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                1. Éditeur du site
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Le site <strong>vanzonexplorer.com</strong> est édité par :
                <br />
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

            {/* Hébergeur */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                2. Hébergeur
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Le site est hébergé par :
                <br />
                <strong>Vercel Inc.</strong>
                <br />
                440 N Barranca Ave #4133
                <br />
                Covina, CA 91723 — États-Unis
                <br />
                Site : vercel.com
              </p>
            </div>

            {/* Activité */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                3. Activité
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Vanzon Explorer opère dans trois domaines :
              </p>
              <ul className="text-slate-600 space-y-2 list-none pl-0 mt-3">
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span>
                    <strong>Location de vans aménagés :</strong> mise en
                    relation entre propriétaires de vans et voyageurs via les
                    plateformes Yescapa et Wikicampers.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span>
                    <strong>Formation en ligne (Van Business Academy) :</strong>{" "}
                    programme d&apos;accompagnement pour créer une activité de
                    location de van aménagé. Formations vidéo hébergées sur
                    Bunny.net, paiement sécurisé via Stripe.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-accent-blue font-bold mt-0.5">—</span>
                  <span>
                    <strong>Contenu éditorial :</strong> articles de blog sur le
                    voyage en van, itinéraires au Pays Basque, guides pratiques.
                  </span>
                </li>
              </ul>
            </div>

            {/* Propriété intellectuelle */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                4. Propriété intellectuelle
              </h2>
              <p className="text-slate-600 leading-relaxed">
                L&apos;ensemble des contenus présents sur ce site (textes,
                images, graphismes, logos, vidéos, logiciels) est la propriété
                exclusive de Vanzon Explorer, sauf mentions contraires. Toute
                reproduction, distribution, modification ou retransmission est
                strictement interdite sans accord écrit préalable.
              </p>
            </div>

            {/* Responsabilité */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                5. Limitation de responsabilité
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Vanzon Explorer s&apos;efforce d&apos;assurer l&apos;exactitude
                des informations diffusées. Cependant, nous ne pouvons garantir
                l&apos;exactitude, la complétude ou l&apos;actualité de ces
                informations. Vanzon Explorer décline toute responsabilité pour
                toute imprécision ou omission. Les réservations de vans
                transitent via des plateformes tierces (Yescapa, Wikicampers)
                qui gèrent l&apos;assurance et le paiement.
              </p>
            </div>

            {/* Liens */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                6. Liens hypertextes
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Le site peut contenir des liens vers d&apos;autres sites
                internet (Yescapa, Wikicampers, Calendly, Stripe, etc.). Vanzon
                Explorer n&apos;exerce aucun contrôle sur ces sites et
                n&apos;assume aucune responsabilité quant à leur contenu.
              </p>
            </div>

            {/* Données personnelles */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                7. Données personnelles
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Le traitement des données personnelles est décrit dans notre{" "}
                <a
                  href="/confidentialite"
                  className="text-accent-blue hover:underline"
                >
                  Politique de confidentialité
                </a>
                .
              </p>
            </div>

            {/* Contact */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">
                8. Contact
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Pour toute question :{" "}
                <a
                  href="mailto:contact@vanzonexplorer.com"
                  className="text-accent-blue hover:underline"
                >
                  contact@vanzonexplorer.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
