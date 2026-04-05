"use client";

import { useState } from "react";

// ── Groupes Facebook cibles ──────────────────────────────────────────────────

const GROUPS = [
  {
    id: 1,
    name: "Location camping-car / vans / Fourgon entre particuliers",
    url: "https://www.facebook.com/groups/3889048827834863/",
    priority: true,
    note: "Intention directe de location — tes clients cibles",
  },
  {
    id: 2,
    name: "VAN LIFE FRANCE",
    url: "https://www.facebook.com/groups/vanlifefrance/",
    priority: false,
    note: "Grande communauté, mixte locataires + passionnés",
  },
  {
    id: 3,
    name: "VanLife France",
    url: "https://www.facebook.com/groups/549117645488541/",
    priority: false,
    note: "Deuxième grand groupe généraliste France",
  },
  {
    id: 4,
    name: "Fourgon aménagé rencontre",
    url: "https://www.facebook.com/groups/1448105298687012/",
    priority: false,
    note: "Communauté engagée, profil voyageur",
  },
  {
    id: 5,
    name: "Aménage Ton VAN",
    url: "https://www.facebook.com/groups/amenagetonvan/",
    priority: false,
    note: "Profils intéressés par le van = clients potentiels",
  },
  {
    id: 6,
    name: "Groupe Facebook — Ajouté manuellement",
    url: "https://www.facebook.com/groups/1050405232430141",
    priority: false,
    note: "",
  },
];

// ── Post à copier ────────────────────────────────────────────────────────────

const POST_TEXT = `Hello ! 👋 J'ai deux vans aménagés disponibles cet été au Pays Basque pour vos prochaines aventures !

Je propose Yoni (Trafic vert) et Xalbat (Trafic blanc) deux vans bien équipés, lit fixe, panneau solaire prêts à partir. ☀️

📍 Départ depuis Cambo-les-Bains (64), à 20 min de Biarritz
💰 À partir de 65€/jour, 95€/jour en haute saison (dès le 15 avril)
🛡️ Assurance tous risque incluse

Des questions ? MP ou commentaire, je réponds vite 🙂

Plus d'infos ici 👇

🔗 https://vanzonexplorer.com/location/yoni
🔗 https://vanzonexplorer.com/location/xalbat`;

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LocationProspectionPage() {
  const [posted, setPosted] = useState<number[]>([]);
  const [copied, setCopied] = useState(false);

  function togglePosted(id: number) {
    setPosted((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  async function copyPost() {
    await navigator.clipboard.writeText(POST_TEXT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-2">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Prospection Location</h1>
        <p className="text-sm text-slate-500 mt-1">
          Poster dans les groupes Facebook pour optimiser le taux d&apos;occupation
        </p>
      </div>

      {/* Rappel fréquence */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
        <span className="text-xl">⏱️</span>
        <div className="text-sm text-blue-800 space-y-0.5">
          <p className="font-bold">Règles de posting</p>
          <p className="text-blue-700">Max 1 fois par semaine par groupe · Lien en commentaire (pas dans le post) · Meilleurs créneaux : dim 19h-21h, jeu 18h-20h, mar-mer 12h-13h</p>
        </div>
      </div>

      {/* Groupes cibles */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Groupes cibles ({GROUPS.length})</h2>
          <span className="text-xs text-slate-400">{posted.length}/{GROUPS.length} postés</span>
        </div>

        <div className="divide-y divide-slate-50">
          {GROUPS.map((group) => {
            const isDone = posted.includes(group.id);
            return (
              <div
                key={group.id}
                className={`flex items-center gap-4 px-6 py-4 transition-colors ${
                  isDone ? "bg-green-50/50" : "hover:bg-slate-50/50"
                }`}
              >
                {/* Checkbox posté */}
                <button
                  onClick={() => togglePosted(group.id)}
                  className={`w-6 h-6 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                    isDone
                      ? "bg-green-500 border-green-500 text-white"
                      : "border-slate-300 hover:border-green-400"
                  }`}
                  title={isDone ? "Marquer comme non-posté" : "Marquer comme posté"}
                >
                  {isDone && (
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                {/* Infos groupe */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-semibold truncate ${
                        isDone ? "line-through text-slate-400" : "text-slate-900"
                      }`}
                    >
                      {group.name}
                    </span>
                    {group.priority && (
                      <span className="flex-shrink-0 text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full">
                        PRIORITÉ 1
                      </span>
                    )}
                  </div>
                  {group.note && (
                    <p className="text-xs text-slate-400 mt-0.5">{group.note}</p>
                  )}
                </div>

                {/* Bouton ouvrir */}
                <a
                  href={group.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold bg-[#1877F2] hover:bg-[#1464CC] text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Ouvrir
                </a>
              </div>
            );
          })}
        </div>

        {/* Barre de progression */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${(posted.length / GROUPS.length) * 100}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {posted.length}/{GROUPS.length}
            </span>
          </div>
        </div>
      </div>

      {/* Post à copier */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Post prêt à copier</h2>
            <p className="text-xs text-slate-400 mt-0.5">Copie → colle dans le groupe Facebook · Ajoute le lien en commentaire</p>
          </div>
          <button
            onClick={copyPost}
            className={`flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl transition-all ${
              copied
                ? "bg-green-500 text-white shadow-lg shadow-green-500/30 scale-105"
                : "bg-slate-900 text-white hover:bg-slate-800 shadow-md shadow-slate-900/20 hover:shadow-lg hover:scale-[1.02] active:scale-95"
            }`}
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Copié !
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

        {/* Aperçu du post */}
        <div className="px-6 py-6">
          <div className="bg-slate-50 rounded-xl border border-slate-100 px-6 py-5">
            <pre className="whitespace-pre-wrap font-sans text-[14px] text-slate-800 leading-relaxed">
              <strong>Hello ! 👋 J&apos;ai deux vans aménagés disponibles cet été au Pays Basque pour vos prochaines aventures !</strong>
              {`\n\nJe propose `}<strong>Yoni (Trafic vert)</strong>{` et `}<strong>Xalbat (Trafic blanc)</strong>{` deux vans bien équipés, lit fixe, panneau solaire prêts à partir. ☀️\n\n`}
              <strong>📍</strong>{` Départ depuis Cambo-les-Bains (64), à 20 min de Biarritz\n`}
              <strong>💰</strong>{` À partir de `}<strong>65€/jour</strong>{`, `}<strong>95€/jour en haute saison</strong>{` (dès le 15 avril)\n`}
              <strong>🛡️</strong>{` `}<strong>Assurance tous risque incluse</strong>
              {`\n\nDes questions ? MP ou commentaire, je réponds vite 🙂\n\nPlus d'infos ici 👇\n\n`}
              <span className="text-blue-600 underline">🔗 https://vanzonexplorer.com/location/yoni</span>
              {`\n`}
              <span className="text-blue-600 underline">🔗 https://vanzonexplorer.com/location/xalbat</span>
            </pre>
          </div>
        </div>

        {/* Commentaire à poster */}
        <div className="px-6 pb-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
            <p className="text-xs font-bold text-amber-800 mb-2">💬 Commentaire à poster juste après (si le groupe bloque les liens dans les posts)</p>
            <pre className="whitespace-pre-wrap font-sans text-sm text-amber-700">
              {`🔗 https://vanzonexplorer.com/location/yoni\n🔗 https://vanzonexplorer.com/location/xalbat`}
            </pre>
          </div>
        </div>
      </div>

      {/* Reset session */}
      {posted.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => setPosted([])}
            className="text-xs text-slate-400 hover:text-slate-600 underline transition-colors"
          >
            Réinitialiser les coches
          </button>
        </div>
      )}

    </div>
  );
}
