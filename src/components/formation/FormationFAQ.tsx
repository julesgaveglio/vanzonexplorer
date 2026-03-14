const faqs = [
  {
    question: "Est-ce que j'ai besoin de compétences en bricolage ?",
    answer:
      "Non, aucune. Jules lui-même a tout appris de zéro sur YouTube avant de créer cette formation. Chaque geste est montré en vidéo, étape par étape. Si tu peux suivre une recette de cuisine, tu peux construire ton van.",
  },
  {
    question: "Quelle est la différence entre VASP et non-VASP ?",
    answer:
      "Un van non-VASP peut être utilisé pour un usage personnel ou de la location occasionnelle. Un van VASP est homologué officiellement — il ouvre droit à de meilleures conditions d'assurance, se revend plus cher, et est indispensable pour une activité de location professionnelle intensive. La formation couvre les deux.",
  },
  {
    question: "Quel fourgon dois-je acheter ?",
    answer:
      "On recommande le Renault Trafic III (L1H1 ou L2H1 selon ton budget et tes objectifs). Un module complet est dédié au sourcing sur Leboncoin, aux vérifications mécaniques, et à la négociation.",
  },
  {
    question: "Est-ce que je peux gagner de l'argent avec mon van ?",
    answer:
      "Oui. Jules génère des revenus avec son van Yoni en location au Pays Basque. La formation t'apprend à fixer tes prix selon la saison, à créer une annonce qui convertit, et à optimiser ton taux d'occupation.",
  },
  {
    question: "Combien de temps faut-il pour construire son van ?",
    answer:
      "Entre 1,5 et 6 mois selon le temps disponible. En travaillant à plein temps, Jules et Elio ont construit un van en 1,5 mois. À côté d'un emploi, comptez 3 à 6 mois. Ça se fait tranquillement.",
  },
  {
    question: "C'est quoi le processus VASP ? C'est compliqué ?",
    answer:
      "Le VASP (homologation officielle de ton van en camping-car) implique des démarches avec Qualigaz et la DREAL. C'est un processus de 2 à 6 mois. La formation te donne tous les templates, la checklist Airtable et les vidéos explicatives pour y arriver seul.",
  },
  {
    question: "Combien coûte la location d'un van aménagé par jour ?",
    answer:
      "Les tarifs varient selon la saison. Chez Vanzon Explorer au Pays Basque, les prix sont de 65 €/jour en basse saison (janvier, février, novembre), 75 €/jour en moyenne saison (mars à juin, octobre, décembre) et 90 €/jour en haute saison (juillet, août, septembre).",
  },
  {
    question: "Comment fonctionne l'appel de découverte ?",
    answer:
      "C'est un appel gratuit de 30 minutes avec un membre de l'équipe. On comprend ton projet, on répond à tes questions, et si la formation est faite pour toi, on t'explique comment rejoindre la prochaine session.",
  },
];

export default function FormationFAQ() {
  return (
    <section className="py-20" style={{ background: "#FAF6F0" }}>
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
          Questions fréquentes
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details key={i} className="glass-card !p-0 overflow-hidden group">
              <summary className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50/60 transition-colors cursor-pointer list-none">
                <span className="font-semibold text-slate-900 text-sm md:text-base">
                  {faq.question}
                </span>
                <span className="text-slate-400 flex-shrink-0 transition-transform duration-200 group-open:rotate-180">
                  ▼
                </span>
              </summary>
              <div className="px-5 pb-5 pt-1">
                <p className="text-sm text-slate-600 leading-relaxed">{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
