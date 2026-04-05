"use client";

import { useState } from "react";

// ── Templates de messages Facebook ──────────────────────────────────────────

interface MessageTemplate {
  id: string;
  label: string;
  tone: string;
  toneColor: string;
  toneIcon: string;
  target: string;
  message: string;
}

const TEMPLATES: MessageTemplate[] = [
  // ── Axe principal : "Trafic → vos vans" (3 variantes) ──
  {
    id: "main-v1",
    label: "V1 — Originale améliorée",
    tone: "Axe principal",
    toneColor: "bg-indigo-100 text-indigo-700 border-indigo-200",
    toneIcon: "🎯",
    target: "Groupes vanlife / location van",
    message: `Salut a tous,

Enchanté, je m'appelle Jules. Je loue deux fourgons aménagés au Pays Basque depuis un moment et j'ai monté Vanzon Explorer, un site vanlife qui génère 15 000 visites/mois de passionnés qui cherchent un van pour leur prochain road trip.

Aujourd'hui je lance la partie location entre particuliers. L'idée est simple : rediriger ce trafic qualifié vers VOS vans, plutôt que vous payiez 15-20% de commission ailleurs.

L'offre pour les premiers inscrits :
✅ 0% de commission pendant 6 mois
✅ Zéro exclusivité — vous gardez tous vos autres canaux
✅ Votre van a sa propre page référencée sur Google

Je cherche 10-15 proprios motivés pour lancer l'aventure avec moi.

Si ça vous parle : https://vanzonexplorer.com/proposer-votre-van (30 sec, aucun engagement)

Dispo en commentaire ou en MP si vous avez des questions.

Jules`,
  },
  {
    id: "main-v2",
    label: "V2 — Angle frustration commissions",
    tone: "Axe principal",
    toneColor: "bg-indigo-100 text-indigo-700 border-indigo-200",
    toneIcon: "🎯",
    target: "Groupes location van / proprios Yescapa",
    message: `Salut a tous,

Petite question : ça vous fait quoi de lâcher 15-20% de commission à chaque réservation ?

Moi ça m'a motivé à créer autre chose. Je loue deux fourgons au Pays Basque et j'ai monté Vanzon Explorer — un site vanlife qui fait 15 000 visites/mois sur Google. Des gens qui cherchent un van, prêts à réserver.

Aujourd'hui j'ouvre ce trafic aux autres proprios. Le deal est simple :
✅ 0% de commission pendant 6 mois
✅ On crée votre page van, les visiteurs arrivent via Google
✅ Vous gardez vos autres canaux, c'est un bonus pas un remplacement

Je prends les 10-15 premiers proprios qui veulent tester.

Inscription en 30 sec : https://vanzonexplorer.com/proposer-votre-van

Des questions ? Je suis là en commentaire.

Jules`,
  },
  {
    id: "main-v3",
    label: "V3 — Angle communauté & transparence",
    tone: "Axe principal",
    toneColor: "bg-indigo-100 text-indigo-700 border-indigo-200",
    toneIcon: "🎯",
    target: "Groupes vanlife / entraide / aménagement",
    message: `Salut a tous,

Je vais être transparent : je cherche des proprios de vans pour un projet qui me tient à coeur.

Je m'appelle Jules, je loue deux fourgons au Pays Basque. A côté, j'ai créé Vanzon Explorer — un site vanlife avec des articles, des guides, des itinéraires. Résultat : 15 000 visites/mois de gens qui veulent louer un van.

Le problème ? J'ai le trafic, mais pas assez de vans à proposer. Du coup je lance un truc simple : vous inscrivez votre van, on vous crée une page sur notre site, et les visiteurs sont redirigés vers votre annonce. Vous ne changez rien à votre fonctionnement actuel.

Pendant le lancement :
✅ 0% de commission pendant 6 mois
✅ Aucune exclusivité
✅ 30 secondes pour s'inscrire

Je cherche une quinzaine de proprios pour démarrer : https://vanzonexplorer.com/proposer-votre-van

Si vous hésitez, posez vos questions ici, je réponds à tout.

Jules`,
  },
  // ── Ton ultra-court ──
  {
    id: "short-1",
    label: "Express compact",
    tone: "Ultra-court",
    toneColor: "bg-red-100 text-red-700 border-red-200",
    toneIcon: "⚡",
    target: "Groupes avec règles anti-promo strictes",
    message: `Proprio de van aménagé ? Je loue 2 fourgons au Pays Basque et mon site fait 15K visites/mois. Je cherche 10-15 proprios pour leur rediriger ce trafic gratuitement (0% commission pendant 6 mois). 30 sec pour s'inscrire : https://vanzonexplorer.com/proposer-votre-van`,
  },
  {
    id: "short-2",
    label: "MP direct",
    tone: "Ultra-court",
    toneColor: "bg-red-100 text-red-700 border-red-200",
    toneIcon: "⚡",
    target: "Message privé a un proprio",
    message: `Salut ! J'ai vu que tu loues ton van — je loue aussi 2 fourgons au Pays Basque et j'ai un site vanlife qui fait 15K visites/mois. Je lance la location entre particuliers, 0% de commission pendant 6 mois. Si ça t'intéresse : https://vanzonexplorer.com/proposer-votre-van`,
  },
  // ── Ton question / engagement ──
  {
    id: "question-1",
    label: "Question ouverte",
    tone: "Question",
    toneColor: "bg-amber-100 text-amber-700 border-amber-200",
    toneIcon: "💬",
    target: "Groupes location van / entraide",
    message: `Question aux proprios de vans qui louent leur véhicule : vous êtes satisfaits de votre taux de remplissage ? Vous aimeriez un canal supplémentaire sans commission ?

Je loue 2 fourgons au Pays Basque et j'ai monté un site (Vanzon Explorer, 15K visites/mois) que j'ouvre maintenant aux autres proprios. 0% de commission pendant 6 mois, aucune exclusivité, on redirige nos visiteurs vers votre annonce.

Curieux d'avoir vos retours : https://vanzonexplorer.com/proposer-votre-van`,
  },
];

// ── Rendu du message avec mise en gras ──────────────────────────────────────

function renderMessage(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    // Lignes avec checkmark → gras
    if (line.startsWith("✅")) {
      return (
        <span key={i}>
          <strong className="text-slate-900">{line}</strong>
          {"\n"}
        </span>
      );
    }

    // Mots/phrases clés à mettre en gras
    const boldPatterns = [
      /(\d[\d\s]*visites\/mois)/g,
      /(15K visites\/mois)/g,
      /(0% de commission[^.!,\n]*)/g,
      /(15-20% de commission)/g,
      /(10-15 (?:proprios|premiers)[\w\s]*)/g,
      /(une quinzaine de proprios)/gi,
      /(Vanzon Explorer)/g,
      /(30 sec[^.!,\n]*)/g,
      /(aucun engagement)/gi,
      /(zéro exclusivité)/gi,
      /(aucune exclusivité)/gi,
    ];

    let parts: (string | JSX.Element)[] = [line];

    for (const pattern of boldPatterns) {
      const newParts: (string | JSX.Element)[] = [];
      for (const part of parts) {
        if (typeof part !== "string") {
          newParts.push(part);
          continue;
        }
        const segments = part.split(pattern);
        for (let j = 0; j < segments.length; j++) {
          if (pattern.test(segments[j])) {
            // Reset lastIndex since we use /g
            pattern.lastIndex = 0;
            newParts.push(
              <strong key={`${i}-${j}-${pattern.source}`} className="text-slate-900">
                {segments[j]}
              </strong>
            );
          } else {
            newParts.push(segments[j]);
          }
        }
      }
      parts = newParts;
    }

    return (
      <span key={i}>
        {parts}
        {"\n"}
      </span>
    );
  });
}

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
    <div className="max-w-4xl mx-auto space-y-8 py-2">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">💬</span>
            <h1 className="text-2xl font-black">Messages de prospection</h1>
          </div>
          <p className="text-indigo-200 text-sm max-w-lg">
            {TEMPLATES.length} messages prets a copier-coller sur les groupes Facebook.
            Varie les approches pour ne pas spammer le meme texte.
          </p>
          <div className="flex gap-6 mt-6">
            {[
              { value: TEMPLATES.length, label: "Templates" },
              { value: tones.length, label: "Tons" },
              { value: "0%", label: "Commission" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-black">{s.value}</div>
                <div className="text-xs text-indigo-300 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lien formulaire */}
      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3">
        <span className="text-lg">🔗</span>
        <span className="text-sm text-slate-500">Lien a partager :</span>
        <code className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
          vanzonexplorer.com/proposer-votre-van
        </code>
      </div>

      {/* Filtre par ton */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterTone("all")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            filterTone === "all"
              ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
              : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:shadow-sm"
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
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                filterTone === tone
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                  : `bg-white border ${tpl.toneColor} hover:shadow-sm`
              }`}
            >
              {tpl.toneIcon} {tone} ({count})
            </button>
          );
        })}
      </div>

      {/* Liste des messages */}
      <div className="space-y-5">
        {filtered.map((tpl, index) => (
          <div
            key={tpl.id}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Header du template */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <span className="text-xl">{tpl.toneIcon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${tpl.toneColor}`}>
                      {tpl.tone}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm">{tpl.label}</h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Cible : {tpl.target}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-1 rounded">
                  #{index + 1}
                </span>
              </div>
            </div>

            {/* Corps du message — style "bulle Facebook" */}
            <div className="px-6 py-6">
              <div className="bg-slate-50 rounded-xl px-5 py-4 border border-slate-100">
                <pre className="whitespace-pre-wrap font-sans text-[13.5px] text-slate-700 leading-relaxed">
                  {renderMessage(tpl.message)}
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-400 font-mono">
                  {tpl.message.length} car.
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  tpl.message.length > 800
                    ? "bg-amber-100 text-amber-600"
                    : "bg-green-100 text-green-600"
                }`}>
                  {tpl.message.length > 800 ? "Long" : "Optimal"}
                </span>
              </div>
              <button
                onClick={() => copyToClipboard(tpl.id, tpl.message)}
                className={`flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl transition-all ${
                  copiedId === tpl.id
                    ? "bg-green-500 text-white shadow-lg shadow-green-500/30 scale-105"
                    : "bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-900/20 hover:shadow-lg hover:scale-[1.02] active:scale-95"
                }`}
              >
                {copiedId === tpl.id ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Copie !
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copier
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-xl mt-0.5">💡</span>
          <div className="text-sm text-amber-800 space-y-1">
            <p className="font-bold">Conseils de prospection</p>
            <ul className="space-y-1 text-amber-700">
              <li>Ne poste jamais le meme message 2 fois dans le meme groupe</li>
              <li>Alterne entre les 3 variantes principales</li>
              <li>Utilise les formats courts pour les MP directs</li>
              <li>Reponds toujours aux commentaires sous ton post</li>
              <li>Max 5 groupes par jour pour eviter le ban Facebook</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
