"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Module {
  number: number;
  icon: string;
  title: string;
  videoCount: number;
  lessons: string[];
}

const modules: Module[] = [
  {
    number: 1,
    icon: "👋",
    title: "Bienvenue & Vision",
    videoCount: 4,
    lessons: [
      "Présentation de Jules — son parcours, ses vans",
      "Aperçu complet de la formation",
      "Ce qu'un van t'apporte vraiment (bénéfices cachés)",
      "Quel type de projet van est fait pour toi ? (VASP vs non-VASP)",
    ],
  },
  {
    number: 2,
    icon: "🚐",
    title: "Sourcing & Achat du fourgon",
    videoCount: 8,
    lessons: [
      "Le bon utilitaire : pourquoi le Renault Trafic III",
      "Où et comment chercher sur Leboncoin efficacement",
      "Les vérifications mécaniques AVANT de te déplacer",
      "Comment se positionner en 1er sur les bonnes annonces (prompt IA)",
      "Les indispensables à vérifier lors du RDV sur place",
      "Technique de la pièce de 2€ pour vérifier les pneus",
      "Technique de la 3ème pour vérifier l'embrayage",
      "Comment négocier intelligemment ton véhicule",
    ],
  },
  {
    number: 3,
    icon: "💡",
    title: "Conception & Budget",
    videoCount: 9,
    lessons: [
      "Trouver ses inspirations et définir son style",
      "Les erreurs d'aménagement à éviter absolument",
      "Cuisines coulissantes : latérale vs arrière",
      "Les bonnes questions à se poser pour choisir son aménagement",
      "Combien de temps pour les travaux ? (réalité terrain)",
      "Budget complet : présentation du tableau Airtable",
      "L'outillage nécessaire (et où l'acheter au meilleur prix)",
      "Le bois : choisir le bon matériau",
      "Ce qu'il faut savoir sur le VASP",
    ],
  },
  {
    number: 4,
    icon: "🛠️",
    title: "Aménagement non-VASP",
    videoCount: 10,
    lessons: [
      "Nettoyage du fourgon",
      "Poser la fenêtre latérale",
      "Isolation Armaflex + Feutrine (le meilleur isolant été/hiver)",
      "La structure : tasseaux, quantités, fixations",
      "Poncer et vernir les murs (sans tout refaire de zéro)",
      "Cadrant de fenêtre finition",
      "Un sol stylé et économique (OSB3 + moquette)",
      "Bricolage & meubles : construire ses cubes en bois",
      "Table coulissante intérieure",
      "Lit peigne : le système qui change tout",
    ],
  },
  {
    number: 5,
    icon: "⚡",
    title: "Électricité",
    videoCount: 6,
    lessons: [
      "Présentation complète du circuit électrique van",
      "Faire des raccords solides et sécurisés (COS)",
      "La base de l'électricité pour débutants complets",
      "Calculer sa consommation pour choisir sa batterie",
      "Section de câble et sécurité — fusibles, dimensionnement",
      "Schéma du circuit électrique complet",
    ],
  },
  {
    number: 6,
    icon: "📄",
    title: "L'Homologation VASP",
    videoCount: 5,
    lessons: [
      "Introduction : c'est quoi la norme VASP et pourquoi l'obtenir",
      "Les éléments obligatoires pour homologuer son van",
      "Le processus étape par étape (Qualigaz → DREAL → ANTS)",
      "Combien ça coûte réellement ?",
      "Avantages & inconvénients, impact sur l'assurance",
    ],
  },
  {
    number: 7,
    icon: "📋",
    title: "Les Normes VASP en détail",
    videoCount: 11,
    lessons: [
      "Normes d'aérations (basse, haute, lanterneau)",
      "Normes circuit d'eau (cuve, remplissage, toilettes)",
      "Normes aménagement (fixations, lit, placards)",
      "Normes plaques de cuisson",
      "Normes gaz (distances, matériaux certifiés)",
      "Normes électricité (batterie auxiliaire, câbles, 230V)",
      "Normes marche-pied (dimensions, charge, antidérapant)",
      "Normes issue de secours",
      "Normes de poids (PTAC, pesée, répartition des charges)",
      "Les étiquettes obligatoires dans le van",
      "Les objets obligatoires (extincteur, détecteur gaz/CO)",
    ],
  },
  {
    number: 8,
    icon: "📁",
    title: "Démarches Administratives",
    videoCount: 5,
    lessons: [
      "Les dossiers VASP : organisation et checklist Airtable",
      "Remplir la demande de réception",
      "L'attestation de travaux",
      "Le processus DREAL complet",
      "Le certificat de conformité Qualigaz",
    ],
  },
  {
    number: 9,
    icon: "💰",
    title: "Business de Location",
    videoCount: 15,
    lessons: [
      "Présentation du modèle business van",
      "Étude de marché : la vanlife après Covid",
      "Briser les croyances limitantes (\"et si ça casse ?\")",
      "Assurance & caution : tout ce qu'il faut savoir",
      "Fixer ses prix & comprendre la saisonnalité",
      "Estimation de revenus (chiffres réels)",
      "Mise en ligne sur Yescapa, Outdoorsy, Privatecar",
      "Optimiser son taux d'occupation",
      "Gestion client & communication (cibler les couples)",
      "Remise des clés : le départ parfait",
      "L'état des lieux au retour",
      "Mon expérience et mes vrais chiffres",
      "Automatisations pour gagner du temps",
      "Déclaration en particulier",
      "Déclaration en professionnel",
    ],
  },
];

export default function ProgrammeAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpenIndex((prev) => (prev === i ? null : i));
  };

  return (
    <section id="programme" className="bg-white py-20">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="badge-glass !px-4 !py-2 text-sm font-medium" style={{ background: 'rgba(205,167,123,0.12)', border: '1px solid rgba(205,167,123,0.35)', color: '#B9945F' }}>
            Accès immédiat · 9 modules · 50+ vidéos
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-6">
            Le programme complet
          </h2>
        </div>

        <div className="space-y-3">
          {modules.map((mod, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={mod.number} className="glass-card !p-0 overflow-hidden">
                <button
                  onClick={() => toggle(i)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50/60 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#F5EDE5] text-[#B9945F] flex items-center justify-center text-sm font-bold">
                    {mod.number}
                  </span>
                  <span className="text-xl flex-shrink-0">{mod.icon}</span>
                  <span className="flex-1 font-semibold text-slate-900 text-sm md:text-base">
                    {mod.title}
                  </span>
                  <span className="text-xs text-slate-400 flex-shrink-0 hidden sm:inline">
                    {mod.videoCount} vidéos
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-slate-400 flex-shrink-0"
                  >
                    ▼
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 pt-1 bg-[#FAF6F0]/60">
                        <ul className="space-y-2">
                          {mod.lessons.map((lesson, j) => (
                            <li key={j} className="flex items-start gap-2 text-sm text-slate-600">
                              <span className="mt-0.5 flex-shrink-0" style={{ color: '#B9945F' }}>✓</span>
                              {lesson}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
