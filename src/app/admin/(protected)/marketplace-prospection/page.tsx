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
  // ── Ton direct / professionnel ──
  {
    id: "direct-1",
    label: "Pitch direct",
    tone: "Pro & direct",
    toneColor: "bg-blue-100 text-blue-700",
    target: "Propriétaires actifs sur Yescapa/Wikicampers",
    message: `Salut ! Je vois que tu loues ton van sur [plateforme] — est-ce que tu serais intéressé par un canal de visibilité supplémentaire ?

On a lancé Vanzon Explorer, un site spécialisé location de vans au Pays Basque / Sud-Ouest, déjà référencé sur Google.

Pendant le lancement c'est 100% gratuit : on crée une page dédiée pour ton van sur notre site, avec redirection vers ton annonce existante. 0 commission, 0 engagement.

Si ça t'intéresse, 2 min pour s'inscrire : https://vanzonexplorer.com/proposer-votre-van

Hésite pas si t'as des questions !`,
  },
  {
    id: "direct-2",
    label: "Proposition de valeur chiffrée",
    tone: "Pro & direct",
    toneColor: "bg-blue-100 text-blue-700",
    target: "Propriétaires qui cherchent plus de réservations",
    message: `Hello ! Tu loues ton van et tu aimerais plus de réservations ?

On a créé Vanzon Explorer — un site qui attire chaque mois des centaines de personnes qui cherchent un van à louer via Google. Pendant le lancement, on référence ton van gratuitement (0% de commission).

Concrètement : on crée ta page van, les visiteurs te trouvent via Google, et on les redirige vers ta plateforme de réservation. Toi tu ne fais rien.

Inscription rapide ici : https://vanzonexplorer.com/proposer-votre-van`,
  },
  // ── Ton décontracté / communautaire ──
  {
    id: "cool-1",
    label: "Entre vanlifers",
    tone: "Décontracté",
    toneColor: "bg-green-100 text-green-700",
    target: "Groupes vanlife / communautés",
    message: `Hey la commu !

On est Jules et Elio, on loue nos deux vans aménagés au Pays Basque et on a monté un petit site (Vanzon Explorer) pour aider les gens à trouver des vans à louer dans le coin.

On cherche d'autres proprios de vans qui voudraient apparaître sur notre site gratuitement. L'idée c'est simple : on vous fait une page sur notre site, les gens vous trouvent via Google, et on les renvoie vers votre annonce. C'est gratuit, y'a aucune commission pendant le lancement.

Si ça vous parle : https://vanzonexplorer.com/proposer-votre-van

Et si vous avez des questions, balancez en commentaire ou en MP !`,
  },
  {
    id: "cool-2",
    label: "Story personnelle",
    tone: "Décontracté",
    toneColor: "bg-green-100 text-green-700",
    target: "Groupes aménagement / DIY van",
    message: `Salut tout le monde !

Petit retour d'expérience : on loue nos vans aménagés depuis le Pays Basque et on s'est rendu compte que les grosses plateformes prennent pas mal de commission (15-16%...). Du coup on a créé notre propre site, Vanzon Explorer, pour avoir un canal de réservation en plus.

Aujourd'hui on ouvre le site aux autres proprios. Pendant le lancement c'est 0% de commission — on crée votre page van gratuitement et on redirige les visiteurs vers votre annonce. L'objectif c'est de construire un réseau de vans dans le Sud-Ouest / Pays Basque.

2 min pour s'inscrire si ça vous tente : https://vanzonexplorer.com/proposer-votre-van`,
  },
  // ── Ton curieux / question ──
  {
    id: "question-1",
    label: "Question ouverte",
    tone: "Curieux / question",
    toneColor: "bg-amber-100 text-amber-700",
    target: "Groupes location van / entraide",
    message: `Question aux proprios de vans qui louent leur véhicule : vous utilisez quoi comme plateforme ? Vous êtes satisfaits du taux de remplissage ?

Nous on a monté un site (Vanzon Explorer) spécialisé location de vans au Pays Basque. On commence à avoir du trafic Google et on cherche des proprios pour étoffer notre catalogue.

C'est gratuit pendant le lancement — on crée votre page, on redirige vers votre annonce existante. 0 commission.

Curieux d'avoir vos retours ! Et si ça vous intéresse : https://vanzonexplorer.com/proposer-votre-van`,
  },
  {
    id: "question-2",
    label: "Sondage engagement",
    tone: "Curieux / question",
    toneColor: "bg-amber-100 text-amber-700",
    target: "Tout groupe vanlife",
    message: `Petit sondage pour les proprios de vans aménagés :

Si un site vous proposait de référencer votre van gratuitement sur Google (avec votre propre page et une redirection vers votre annonce), ça vous intéresserait ?

C'est exactement ce qu'on fait avec Vanzon Explorer. Pendant le lancement, c'est 0% de commission. On veut juste aider les proprios à avoir plus de visibilité.

Dites-moi en commentaire si c'est le genre de truc qui vous parlerait !

Pour ceux qui veulent tester : https://vanzonexplorer.com/proposer-votre-van`,
  },
  // ── Ton urgence / exclusivité ──
  {
    id: "exclu-1",
    label: "Premiers inscrits",
    tone: "Exclusivité",
    toneColor: "bg-purple-100 text-purple-700",
    target: "Proprios motivés / early adopters",
    message: `Appel aux propriétaires de vans aménagés dans le Sud-Ouest !

On lance Vanzon Explorer et on cherche nos premiers partenaires. Les premiers inscrits auront :
- Une page van dédiée sur notre site (référencé Google)
- 0% de commission pendant toute la phase de lancement
- Un traitement prioritaire quand on passera à la réservation directe

On loue nous-mêmes 2 vans au Pays Basque, on connaît le métier. L'objectif : construire LE réseau de vans aménagés dans la région.

Inscription (2 min) : https://vanzonexplorer.com/proposer-votre-van`,
  },
  // ── Ton ultra-court ──
  {
    id: "short-1",
    label: "Express 3 lignes",
    tone: "Ultra-court",
    toneColor: "bg-red-100 text-red-700",
    target: "Groupes avec règles anti-promo strictes",
    message: `Proprio de van aménagé ? On référence votre van gratuitement sur Google pendant le lancement de notre site (0% commission). 2 min : https://vanzonexplorer.com/proposer-votre-van`,
  },
  {
    id: "short-2",
    label: "MP direct",
    tone: "Ultra-court",
    toneColor: "bg-red-100 text-red-700",
    target: "Message privé direct",
    message: `Salut ! J'ai vu que tu loues ton van — ça t'intéresserait d'avoir une page dédiée sur notre site pour plus de visibilité ? C'est gratuit pendant le lancement (0% commission). Voilà le lien si jamais : https://vanzonexplorer.com/proposer-votre-van`,
  },
  // ── Ton entraide / valeur ajoutée ──
  {
    id: "value-1",
    label: "Partage d'expérience",
    tone: "Entraide",
    toneColor: "bg-teal-100 text-teal-700",
    target: "Groupes entraide vanlife / business",
    message: `Retour d'expérience pour ceux qui louent leur van :

Avec mon associé, on loue 2 vans au Pays Basque depuis un moment. On s'est vite rendu compte que le référencement Google, c'est ce qui fait la différence pour remplir un planning (et pas juste dépendre des algorithmes de Yescapa).

Du coup on a monté Vanzon Explorer — un site avec du vrai contenu vanlife qui attire du trafic organique. Aujourd'hui on ouvre aux autres proprios : on vous crée une page van sur notre site, gratuitement, avec un lien vers votre annonce. C'est un canal supplémentaire, pas un remplacement.

Si ça vous intéresse : https://vanzonexplorer.com/proposer-votre-van

Happy à répondre à vos questions sur la location ou le référencement !`,
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
