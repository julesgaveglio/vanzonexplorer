"use client";

import { useState, useEffect, useCallback } from "react";

// ── Types ───────────────────────────────────────────────────────────────────

interface Template {
  id: string;
  label: string;
  tone: string;
  tone_color: string;
  tone_icon: string;
  target: string;
  message: string;
  sort_order: number;
}

// ── Templates par défaut (seed) ─────────────────────────────────────────────

const DEFAULT_TEMPLATES: Omit<Template, "id">[] = [
  {
    label: "V1 — Originale améliorée",
    tone: "Axe principal",
    tone_color: "bg-indigo-100 text-indigo-700 border-indigo-200",
    tone_icon: "🎯",
    target: "Groupes vanlife / location van",
    sort_order: 1,
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
    label: "V2 — Angle frustration commissions",
    tone: "Axe principal",
    tone_color: "bg-indigo-100 text-indigo-700 border-indigo-200",
    tone_icon: "🎯",
    target: "Groupes location van / proprios Yescapa",
    sort_order: 2,
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
    label: "V3 — Angle communauté & transparence",
    tone: "Axe principal",
    tone_color: "bg-indigo-100 text-indigo-700 border-indigo-200",
    tone_icon: "🎯",
    target: "Groupes vanlife / entraide / aménagement",
    sort_order: 3,
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
  {
    label: "Express compact",
    tone: "Ultra-court",
    tone_color: "bg-red-100 text-red-700 border-red-200",
    tone_icon: "⚡",
    target: "Groupes avec règles anti-promo strictes",
    sort_order: 4,
    message: `Proprio de van aménagé ? Je loue 2 fourgons au Pays Basque et mon site fait 15K visites/mois. Je cherche 10-15 proprios pour leur rediriger ce trafic gratuitement (0% commission pendant 6 mois). 30 sec pour s'inscrire : https://vanzonexplorer.com/proposer-votre-van`,
  },
  {
    label: "MP direct",
    tone: "Ultra-court",
    tone_color: "bg-red-100 text-red-700 border-red-200",
    tone_icon: "⚡",
    target: "Message privé a un proprio",
    sort_order: 5,
    message: `Salut ! J'ai vu que tu loues ton van — je loue aussi 2 fourgons au Pays Basque et j'ai un site vanlife qui fait 15K visites/mois. Je lance la location entre particuliers, 0% de commission pendant 6 mois. Si ça t'intéresse : https://vanzonexplorer.com/proposer-votre-van`,
  },
  {
    label: "Question ouverte",
    tone: "Question",
    tone_color: "bg-amber-100 text-amber-700 border-amber-200",
    tone_icon: "💬",
    target: "Groupes location van / entraide",
    sort_order: 6,
    message: `Question aux proprios de vans qui louent leur véhicule : vous êtes satisfaits de votre taux de remplissage ? Vous aimeriez un canal supplémentaire sans commission ?

Je loue 2 fourgons au Pays Basque et j'ai monté un site (Vanzon Explorer, 15K visites/mois) que j'ouvre maintenant aux autres proprios. 0% de commission pendant 6 mois, aucune exclusivité, on redirige nos visiteurs vers votre annonce.

Curieux d'avoir vos retours : https://vanzonexplorer.com/proposer-votre-van`,
  },
];

// ── Rendu du message avec mise en gras ──────────────────────────────────────

function renderMessage(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("✅")) {
      return (
        <span key={i}>
          <strong className="text-slate-900">{line}</strong>
          {"\n"}
        </span>
      );
    }

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
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<Template>>({});
  const [saving, setSaving] = useState(false);
  const [filterTone, setFilterTone] = useState("all");
  const [toast, setToast] = useState("");

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }, []);

  // Charger les templates depuis Supabase
  const fetchTemplates = useCallback(async () => {
    const res = await fetch("/api/admin/marketplace-templates");
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      setTemplates(data);
    } else {
      // Seed les templates par défaut
      await fetch("/api/admin/marketplace-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "seed", templates: DEFAULT_TEMPLATES }),
      });
      const res2 = await fetch("/api/admin/marketplace-templates");
      const data2 = await res2.json();
      setTemplates(Array.isArray(data2) ? data2 : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Copier
  async function copyToClipboard(id: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // Editer
  function startEdit(tpl: Template) {
    setEditingId(tpl.id);
    setEditDraft({ label: tpl.label, tone: tpl.tone, tone_icon: tpl.tone_icon, target: tpl.target, message: tpl.message });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft({});
  }

  async function saveEdit(id: string) {
    setSaving(true);
    await fetch("/api/admin/marketplace-templates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...editDraft }),
    });
    setEditingId(null);
    setEditDraft({});
    await fetchTemplates();
    setSaving(false);
    showToast("Message sauvegardé");
  }

  // Supprimer
  async function deleteTemplate(id: string) {
    if (!confirm("Supprimer ce message ?")) return;
    await fetch("/api/admin/marketplace-templates", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await fetchTemplates();
    showToast("Message supprimé");
  }

  const tones = Array.from(new Set(templates.map((t) => t.tone)));
  const filtered = filterTone === "all" ? templates : templates.filter((t) => t.tone === filterTone);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-2">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-green-600 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-xl shadow-green-600/30 animate-[slideIn_0.3s_ease-out]">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Messages de prospection</h1>
          <p className="text-sm text-slate-500 mt-1">
            {templates.length} messages &middot; Clique sur le crayon pour modifier
          </p>
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
          Tous ({templates.length})
        </button>
        {tones.map((tone) => {
          const count = templates.filter((t) => t.tone === tone).length;
          const tpl = templates.find((t) => t.tone === tone)!;
          return (
            <button
              key={tone}
              onClick={() => setFilterTone(tone)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                filterTone === tone
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                  : `bg-white border ${tpl.tone_color} hover:shadow-sm`
              }`}
            >
              {tpl.tone_icon} {tone} ({count})
            </button>
          );
        })}
      </div>

      {/* Liste des messages */}
      <div className="space-y-5">
        {filtered.map((tpl, index) => {
          const isEditing = editingId === tpl.id;

          return (
            <div
              key={tpl.id}
              className={`bg-white rounded-2xl border overflow-hidden shadow-sm transition-all ${
                isEditing ? "border-indigo-300 shadow-indigo-100 shadow-lg ring-2 ring-indigo-200" : "border-slate-200 hover:shadow-md"
              }`}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{tpl.tone_icon}</span>
                  <div>
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <input
                          className="text-sm font-bold text-slate-900 border border-slate-200 rounded-lg px-2 py-1 w-56 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          value={editDraft.label ?? ""}
                          onChange={(e) => setEditDraft({ ...editDraft, label: e.target.value })}
                          placeholder="Nom du template"
                        />
                        <input
                          className="text-xs text-slate-500 border border-slate-200 rounded-lg px-2 py-1 w-40 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                          value={editDraft.target ?? ""}
                          onChange={(e) => setEditDraft({ ...editDraft, target: e.target.value })}
                          placeholder="Cible"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${tpl.tone_color}`}>
                            {tpl.tone}
                          </span>
                          <h3 className="font-bold text-slate-900 text-sm">{tpl.label}</h3>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">Cible : {tpl.target}</p>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-1 rounded">
                    #{index + 1}
                  </span>
                  {!isEditing && (
                    <>
                      <button
                        onClick={() => startEdit(tpl)}
                        className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="Modifier"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteTemplate(tpl.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Supprimer"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Corps du message */}
              <div className="px-6 py-6">
                {isEditing ? (
                  <textarea
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-4 text-[13.5px] text-slate-700 leading-relaxed font-sans resize-y focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-300 min-h-[200px]"
                    rows={12}
                    value={editDraft.message ?? ""}
                    onChange={(e) => setEditDraft({ ...editDraft, message: e.target.value })}
                  />
                ) : (
                  <div className="bg-slate-50 rounded-xl px-5 py-4 border border-slate-100">
                    <pre className="whitespace-pre-wrap font-sans text-[13.5px] text-slate-700 leading-relaxed">
                      {renderMessage(tpl.message)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-xs text-slate-400 font-mono">
                    {(isEditing ? editDraft.message?.length ?? 0 : tpl.message.length)} car.
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    (isEditing ? editDraft.message?.length ?? 0 : tpl.message.length) > 800
                      ? "bg-amber-100 text-amber-600"
                      : "bg-green-100 text-green-600"
                  }`}>
                    {(isEditing ? editDraft.message?.length ?? 0 : tpl.message.length) > 800 ? "Long" : "Optimal"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={cancelEdit}
                        className="text-sm font-semibold px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => saveEdit(tpl.id)}
                        disabled={saving}
                        className="flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
                      >
                        {saving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Sauvegarde...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Sauvegarder
                          </>
                        )}
                      </button>
                    </>
                  ) : (
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
                  )}
                </div>
              </div>
            </div>
          );
        })}
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
