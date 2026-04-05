"use client";

import { useState } from "react";

// ── Templates de messages Facebook ──────────────────────────────────────────

interface MessageTemplate {
  id: string;
  label: string;
  tone: string;
  toneColor: string;
  target: string;
  message: string;
}

const TEMPLATES: MessageTemplate[] = [
  // ── Axe principal : "Trafic → vos vans" (3 variantes) ──
  {
    id: "main-v1",
    label: "V1 — Originale améliorée",
    tone: "Axe principal",
    toneColor: "bg-indigo-100 text-indigo-700",
    target: "Groupes vanlife / location van",
    message: `Salut a tous,

Enchanté, je m'appelle Jules. Je loue deux fourgons aménagés au Pays Basque depuis un moment et j'ai monté Vanzon Explorer, un site vanlife qui génère 15 000 visites/mois de passionnés qui cherchent un van pour leur prochain road trip.

Aujourd'hui je lance la partie location entre particuliers. L'idée est simple : rediriger ce trafic qualifié vers VOS vans, plutôt que vous payiez 15-20% de commission ailleurs.

L'offre pour les premiers inscrits :
- 0% de commission pendant 6 mois
- Zéro exclusivité — vous gardez tous vos autres canaux
- Votre van a sa propre page référencée sur Google

Je cherche 10-15 proprios motivés pour lancer l'aventure avec moi.

Si ça vous parle : https://vanzonexplorer.com/proposer-votre-van (30 sec, aucun engagement)

Dispo en commentaire ou en MP si vous avez des questions.

Jules`,
  },
  {
    id: "main-v2",
    label: "V2 — Angle frustration commissions",
    tone: "Axe principal",
    toneColor: "bg-indigo-100 text-indigo-700",
    target: "Groupes location van / proprios Yescapa",
    message: `Salut a tous,

Petite question : ça vous fait quoi de lâcher 15-20% de commission à chaque réservation ?

Moi ça m'a motivé à créer autre chose. Je loue deux fourgons au Pays Basque et j'ai monté Vanzon Explorer — un site vanlife qui fait 15 000 visites/mois sur Google. Des gens qui cherchent un van, prêts à réserver.

Aujourd'hui j'ouvre ce trafic aux autres proprios. Le deal est simple :
- 0% de commission pendant 6 mois
- On crée votre page van, les visiteurs arrivent via Google
- Vous gardez vos autres canaux, c'est un bonus pas un remplacement

Je prends les 10-15 premiers proprios qui veulent tester.

Inscription en 30 sec : https://vanzonexplorer.com/proposer-votre-van

Des questions ? Je suis là en commentaire.

Jules`,
  },
  {
    id: "main-v3",
    label: "V3 — Angle communauté & transparence",
    tone: "Axe principal",
    toneColor: "bg-indigo-100 text-indigo-700",
    target: "Groupes vanlife / entraide / aménagement",
    message: `Salut a tous,

Je vais être transparent : je cherche des proprios de vans pour un projet qui me tient à coeur.

Je m'appelle Jules, je loue deux fourgons au Pays Basque. A côté, j'ai créé Vanzon Explorer — un site vanlife avec des articles, des guides, des itinéraires. Résultat : 15 000 visites/mois de gens qui veulent louer un van.

Le problème ? J'ai le trafic, mais pas assez de vans à proposer. Du coup je lance un truc simple : vous inscrivez votre van, on vous crée une page sur notre site, et les visiteurs sont redirigés vers votre annonce. Vous ne changez rien à votre fonctionnement actuel.

Pendant le lancement :
- 0% de commission pendant 6 mois
- Aucune exclusivité
- 30 secondes pour s'inscrire

Je cherche une quinzaine de proprios pour démarrer : https://vanzonexplorer.com/proposer-votre-van

Si vous hésitez, posez vos questions ici, je réponds à tout.

Jules`,
  },
  // ── Ton ultra-court ──
  {
    id: "short-1",
    label: "Express 3 lignes",
    tone: "Ultra-court",
    toneColor: "bg-red-100 text-red-700",
    target: "Groupes avec règles anti-promo strictes",
    message: `Proprio de van aménagé ? Je loue 2 fourgons au Pays Basque et mon site fait 15K visites/mois. Je cherche 10-15 proprios pour leur rediriger ce trafic gratuitement (0% commission 6 mois). 30 sec : https://vanzonexplorer.com/proposer-votre-van`,
  },
  {
    id: "short-2",
    label: "MP direct",
    tone: "Ultra-court",
    toneColor: "bg-red-100 text-red-700",
    target: "Message privé à un proprio",
    message: `Salut ! J'ai vu que tu loues ton van — je loue aussi 2 fourgons au Pays Basque et j'ai un site vanlife qui fait 15K visites/mois. Je lance la location entre particuliers, 0% de commission pendant 6 mois. Si ça t'intéresse : https://vanzonexplorer.com/proposer-votre-van`,
  },
  // ── Ton question / engagement ──
  {
    id: "question-1",
    label: "Question ouverte",
    tone: "Question",
    toneColor: "bg-amber-100 text-amber-700",
    target: "Groupes location van / entraide",
    message: `Question aux proprios de vans qui louent leur véhicule : vous êtes satisfaits de votre taux de remplissage ? Vous aimeriez un canal supplémentaire sans commission ?

Je loue 2 fourgons au Pays Basque et j'ai monté un site (Vanzon Explorer, 15K visites/mois) que j'ouvre maintenant aux autres proprios. 0% de commission pendant 6 mois, aucune exclusivité, on redirige nos visiteurs vers votre annonce.

Curieux d'avoir vos retours : https://vanzonexplorer.com/proposer-votre-van`,
  },
];

// ── Composant ───────────────────────────────────────────────────────────────

export default function MarketplaceProspectionPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterTone, setFilterTone] = useState<string>("all");

  const tones = Array.from(new Set(TEMPLATES.map((t) => t.tone)));
  const filtered = filterTone === "all" ? TEMPLATES : TEMPLATES.filter((t) => t.tone === filterTone);

  async function copyToClipboard(id: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Messages de prospection Marketplace</h1>
        <p className="text-sm text-slate-500 mt-1">
          {TEMPLATES.length} templates &middot; Copie et colle sur les groupes Facebook &middot; Varie les approches
        </p>
      </div>

      {/* Filtre par ton */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterTone("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
            filterTone === "all"
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Tous ({TEMPLATES.length})
        </button>
        {tones.map((tone) => {
          const count = TEMPLATES.filter((t) => t.tone === tone).length;
          const tpl = TEMPLATES.find((t) => t.tone === tone)!;
          return (
            <button
              key={tone}
              onClick={() => setFilterTone(tone)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                filterTone === tone
                  ? "bg-slate-900 text-white"
                  : `${tpl.toneColor} hover:opacity-80`
              }`}
            >
              {tone} ({count})
            </button>
          );
        })}
      </div>

      {/* KPIs rapides */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Templates disponibles", value: TEMPLATES.length },
          { label: "Tons différents", value: tones.length },
          { label: "Lien formulaire", value: "proposer-votre-van" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="text-2xl font-black text-slate-900">{k.value}</div>
            <div className="text-sm text-slate-500 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Liste des messages */}
      <div className="space-y-4">
        {filtered.map((tpl) => (
          <div key={tpl.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Header du template */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${tpl.toneColor}`}>
                  {tpl.tone}
                </span>
                <h3 className="font-bold text-slate-900">{tpl.label}</h3>
              </div>
              <span className="text-xs text-slate-400">{tpl.target}</span>
            </div>

            {/* Corps du message */}
            <div className="px-6 py-5">
              <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed">
                {tpl.message}
              </pre>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {tpl.message.length} caractères
              </span>
              <button
                onClick={() => copyToClipboard(tpl.id, tpl.message)}
                className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all ${
                  copiedId === tpl.id
                    ? "bg-green-100 text-green-700"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                }`}
              >
                {copiedId === tpl.id ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Copié !
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copier le message
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
