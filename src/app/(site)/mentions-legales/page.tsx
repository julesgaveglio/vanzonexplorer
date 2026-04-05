import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales du site Vanzon Explorer.",
  robots: { index: false, follow: false },
};

export default function MentionsLegalesPage() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        <div className="glass-card p-10">
          <h1 className="text-3xl font-black text-slate-900 mb-2">Mentions légales</h1>
          <p className="text-sm text-slate-400 mb-10">Conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l&apos;économie numérique.</p>

          <div className="prose prose-slate max-w-none space-y-10">
            {/* Éditeur */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">1. Éditeur du site</h2>
              <p className="text-slate-600 leading-relaxed">
                Le site <strong>vanzonexplorer.com</strong> est édité par :<br />
                <strong>Vanzon Explorer</strong> — Jules Gaveglio<br />
                Bayonne, 64100 — France<br />
                E-mail : <a href="mailto:contact@vanzonexplorer.com" className="text-accent-blue hover:underline">contact@vanzonexplorer.com</a>
              </p>
            </div>

            {/* Hébergeur */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">2. Hébergeur</h2>
              <p className="text-slate-600 leading-relaxed">
                Le site est hébergé par :<br />
                <strong>Vercel Inc.</strong><br />
                440 N Barranca Ave #4133<br />
                Covina, CA 91723 — États-Unis<br />
                Site : <span className="text-accent-blue">vercel.com</span>
              </p>
            </div>

            {/* Propriété intellectuelle */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">3. Propriété intellectuelle</h2>
              <p className="text-slate-600 leading-relaxed">
                L&apos;ensemble des contenus présents sur ce site (textes, images, graphismes, logos, icônes, sons, logiciels) est la propriété exclusive de Vanzon Explorer, sauf mentions contraires. Toute reproduction, distribution, modification, adaptation, retransmission ou publication de ces éléments est strictement interdite sans l&apos;accord écrit préalable de Vanzon Explorer.
              </p>
            </div>

            {/* Responsabilité */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">4. Limitation de responsabilité</h2>
              <p className="text-slate-600 leading-relaxed">
                Vanzon Explorer s&apos;efforce d&apos;assurer l&apos;exactitude des informations diffusées sur ce site. Cependant, Vanzon Explorer ne peut garantir l&apos;exactitude, la complétude ou l&apos;actualité de ces informations. En conséquence, Vanzon Explorer décline toute responsabilité pour toute imprécision, inexactitude ou omission portant sur des informations disponibles sur ce site.
              </p>
            </div>

            {/* Liens hypertextes */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">5. Liens hypertextes</h2>
              <p className="text-slate-600 leading-relaxed">
                Le site vanzonexplorer.com peut contenir des liens vers d&apos;autres sites internet. Vanzon Explorer n&apos;exerce aucun contrôle sur ces sites et n&apos;assume aucune responsabilité quant à leur contenu.
              </p>
            </div>

            {/* Contact */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-3">6. Contact</h2>
              <p className="text-slate-600 leading-relaxed">
                Pour toute question relative au site ou à son contenu, vous pouvez nous contacter à l&apos;adresse suivante :{" "}
                <a href="mailto:contact@vanzonexplorer.com" className="text-accent-blue hover:underline">
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
