"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";

interface Agent {
  id: string;
  name: string;
  emoji: string;
  status: "active" | "inactive" | "paused";
  description: string;
  trigger: "cron" | "manual" | "webhook";
  schedule: string;
  cronExpression: string | null;
  file: string;
  workflow: string | null;
  apis: string[];
  output: string;
  manualCommand: string;
  tags: string[];
  pipeline: string;
}

interface QueueStats {
  published: number;
  pending: number;
  total: number;
}

interface AgentsClientProps {
  agents: Agent[];
  queueStats: QueueStats;
}

// ── Character definitions ────────────────────────────────────────────────────

const CHARACTERS: Record<string, {
  name: string;
  img: string;
  color: string;
  bgGrad: [string, string];
  glow: string;
  border: string;
  role: string;
  tagline: string;
}> = {
  "blog-writer": {
    name: "Mario",
    img: "/agents/mario.png",
    color: "#FF3B30",
    bgGrad: ["#3a0a08", "#1a0504"],
    glow: "rgba(255,59,48,0.45)",
    border: "rgba(255,59,48,0.5)",
    role: "Rédaction SEO",
    tagline: "Le héros qui publie 3×/semaine, sans exception.",
  },
  "keyword-research-quarterly": {
    name: "Luigi",
    img: "/agents/luigi.png",
    color: "#30D158",
    bgGrad: ["#062a14", "#031509"],
    glow: "rgba(48,209,88,0.4)",
    border: "rgba(48,209,88,0.5)",
    role: "Recherche Mots-Clés",
    tagline: "Explore 4 segments, 200 mots-clés chacun, chaque trimestre.",
  },
  "queue-builder-monthly": {
    name: "Toad",
    img: "/agents/toad.png",
    color: "#0A84FF",
    bgGrad: ["#06192e", "#030d18"],
    glow: "rgba(10,132,255,0.4)",
    border: "rgba(10,132,255,0.5)",
    role: "Queue Builder",
    tagline: "Gap analysis + 8 briefs/mois. Zéro doublon.",
  },
  "article-optimizer-quarterly": {
    name: "Yoshi",
    img: "/agents/yoshi.png",
    color: "#34C759",
    bgGrad: ["#162808", "#0b1504"],
    glow: "rgba(52,199,89,0.4)",
    border: "rgba(52,199,89,0.5)",
    role: "Optimiseur Articles",
    tagline: "GSC + Gemini → snippets qui cliquent.",
  },
  "seo-checker": {
    name: "Rosalina",
    img: "/agents/rosalina.png",
    color: "#BF5AF2",
    bgGrad: ["#160d35", "#0b0720"],
    glow: "rgba(191,90,242,0.4)",
    border: "rgba(191,90,242,0.5)",
    role: "Audit SEO",
    tagline: "Surveille les positions chaque lundi depuis son observatoire.",
  },
  "backlinks-daily-outreach": {
    name: "Wario",
    img: "/agents/wario.png",
    color: "#FFD60A",
    bgGrad: ["#2a2000", "#141000"],
    glow: "rgba(255,214,10,0.45)",
    border: "rgba(255,214,10,0.5)",
    role: "Backlinks Outreach",
    tagline: "Chaque jour ouvré, il chasse un backlink et envoie l'email. Sans pitié.",
  },
  "telegram-agent": {
    name: "Peach",
    img: "/agents/peach.png",
    color: "#FF6B9D",
    bgGrad: ["#2a0518", "#15020c"],
    glow: "rgba(255,107,157,0.4)",
    border: "rgba(255,107,157,0.5)",
    role: "Notifications Telegram",
    tagline: "Relaie chaque action des agents directement sur ton Telegram.",
  },
  "link-optimizer-monthly": {
    name: "Waluigi",
    img: "/agents/waluigi.png",
    color: "#FF6961",
    bgGrad: ["#2a0835", "#15041a"],
    glow: "rgba(255,105,97,0.4)",
    border: "rgba(255,105,97,0.5)",
    role: "Link Optimizer",
    tagline: "Chasse les 404 et tisse le maillage. 0 token IA.",
  },
};

// ── Technical details ─────────────────────────────────────────────────────────

interface TechStep { n: number; label: string; detail: string }
interface TechDetails {
  model: string;
  steps: TechStep[];
  apiCalls: string;
  tokenCost: string;
  runTime: string;
  output: string;
  triggerDetail: string;
}

const TECH: Record<string, TechDetails> = {
  "blog-writer": {
    model: "Gemini Flash (méta) + Gemini 2.5 Pro (corps)",
    triggerDetail: "Cron `0 7 * * 1,3,5` — lun/mer/ven 7h UTC",
    steps: [
      { n: 1, label: "Lecture queue", detail: "article-queue.json → filtre status=pending, trie par priority DESC → prend le #1" },
      { n: 2, label: "DataForSEO Keywords", detail: "GET /keyword_ideas/live → volume mensuel + niveau concurrence + CPC pour le targetKeyword" },
      { n: 3, label: "DataForSEO SERP", detail: "GET /serp/google/organic/live → top 5 URLs concurrentes → titre + URL pour bloc ancrage" },
      { n: 4, label: "DataForSEO PAA", detail: "Extrait People Also Ask → injecté comme FAQ obligatoire dans le prompt" },
      { n: 5, label: "Gemini Flash → méta", detail: "Prompt 200 tok → JSON : title (H1), seoTitle (60 ch), seoDescription (155 ch), excerpt (200 ch). Max 512 tokens sortie." },
      { n: 6, label: "Gemini 2.5 Pro → corps", detail: "Prompt complet (persona + SEO data + structure adaptée wordCount) → article Markdown 900-2200 mots selon targetWordCount" },
      { n: 7, label: "Post-process", detail: "injectInternalLinks() → regex sur tous les slugs Sanity publiés → wrap [texte](url) si keyword présent" },
      { n: 8, label: "Pexels image", detail: "searchPexelsPhoto(targetKeyword) → 1er résultat → téléchargement + upload Sanity asset" },
      { n: 9, label: "Sanity publish", detail: "client.createOrReplace() → type 'article', body PortableText, image + credit, seoTitle/seoDesc, publishedAt = now()" },
      { n: 10, label: "Queue update", detail: "article-queue.json → status='published', sanityId, publishedAt, git commit [skip ci]" },
    ],
    apiCalls: "DataForSEO ×3 · Gemini Flash ×1 · Gemini 2.5 Pro ×1 · Pexels ×2 · Sanity ×2",
    tokenCost: "~6k–16k tokens (Gemini 2.5 Pro selon wordCount)",
    runTime: "~45–90s / article",
    output: "Article publié dans Sanity CMS + queue.json mis à jour",
  },
  "keyword-research-quarterly": {
    model: "Aucun LLM — 100% DataForSEO",
    triggerDetail: "Cron `0 6 1 1,4,7,10 *` — 1er jan/avr/jul/oct 6h UTC",
    steps: [
      { n: 1, label: "Chargement segments", detail: "Lit prompts/keyword-research-quarterly.json → 4 segments (location, achat, club, formation) × seeds configurables" },
      { n: 2, label: "DataForSEO Ideas ×4", detail: "POST /dataforseo_labs/google/keyword_ideas/live → seeds[] → max 200 idées/segment, FR, location_code=2250" },
      { n: 3, label: "Scoring", detail: "score = searchVolume × facteur(LOW=1.5, MEDIUM=1.0, HIGH=0.5, TOP=0.3). Filtre: volume ≥ 50" },
      { n: 4, label: "Déduplication", detail: "Cross-segments : si un keyword apparaît dans 2 segments, garde celui au score le plus élevé" },
      { n: 5, label: "Ranking + save", detail: "Sort DESC par score, top 50/segment → keywords-research.json avec topOpportunities[] et keywords[]" },
    ],
    apiCalls: "DataForSEO /keyword_ideas/live ×4 (1 appel par segment)",
    tokenCost: "0 token LLM",
    runTime: "~20–30s",
    output: "scripts/data/keywords-research.json — ~200 opportunités par segment scorées",
  },
  "queue-builder-monthly": {
    model: "Gemini Flash (briefs articles)",
    triggerDetail: "Cron `0 8 1 * *` — 1er du mois 8h UTC (après keyword-research si même jour)",
    steps: [
      { n: 1, label: "Chargement données", detail: "keywords-research.json (dernière analyse) + article-queue.json (état actuel) + prompts/queue-builder-monthly.md" },
      { n: 2, label: "Filtrage scores", detail: "Garde uniquement les keywords avec score ≥ 100. Pool d'opportunités classé par (basePriority + score)" },
      { n: 3, label: "Gap analysis", detail: "isAlreadyCovered() : compare keyword vs title/targetKeyword/secondaryKeywords de la queue existante. Overlap ≥ 2 mots = couvert." },
      { n: 4, label: "Priorisation segment", detail: "Priorités de base : location=90, formation=70, achat=60, club=40. Score final = base + DataForSEO score normalisé" },
      { n: 5, label: "Gemini Flash × N", detail: "Pour chaque opportunité retenue : génère brief JSON (title, slug, excerpt, secondaryKeywords[], category, tag, targetWordCount, wordCountNote)" },
      { n: 6, label: "Ajout queue", detail: "Jusqu'à 8 nouveaux articles/mois ajoutés à article-queue.json avec status='pending', priority calculée, git commit" },
    ],
    apiCalls: "Gemini Flash ×(0–8) selon les gaps détectés",
    tokenCost: "~300–500 tokens par brief (max 8 = ~4k tokens/run)",
    runTime: "~30–60s",
    output: "article-queue.json enrichi de 0–8 nouveaux briefs SEO",
  },
  "article-optimizer-quarterly": {
    model: "Gemini Flash (optimisation snippets)",
    triggerDetail: "Cron `0 7 15 2,5,8,11 *` — 15 fév/mai/août/nov 7h UTC",
    steps: [
      { n: 1, label: "Sélection candidats", detail: "Queue : status=published + sanityId présent + publishedAt ≥ 90 jours. Exclut les articles vérifiés < 30j." },
      { n: 2, label: "OAuth2 GSC", detail: "POST /oauth2/token (refresh_token) → access_token → GET Search Console API pour les 90 derniers jours" },
      { n: 3, label: "Données GSC", detail: "searchAnalytics/query → position, clicks, impressions, CTR par URL" },
      { n: 4, label: "Critères d'optimisation", detail: "Position 6–30 OU CTR < 3% (avec ≥100 impressions) OU impressions > 500 et clicks < 15" },
      { n: 5, label: "Sanity fetch", detail: "Fetch _id, title, body, seoTitle, seoDescription, excerpt pour chaque candidat sélectionné" },
      { n: 6, label: "Gemini Flash × N", detail: "Prompt : article + données GSC + problème identifié → JSON : seoTitle (55–60 ch), seoDescription (150–160 ch), excerpt (100–120 ch), improvements" },
      { n: 7, label: "Sanity patch", detail: "client.patch(_id).set({seoTitle, seoDescription, excerpt}).commit() → métadonnées mises à jour sans toucher le corps" },
      { n: 8, label: "Queue update", detail: "lastSeoCheck = now(), seoPosition stockée. Git commit des timestamps." },
    ],
    apiCalls: "Google OAuth2 ×1 · GSC API ×1 (batch) · Sanity GET ×N · Gemini Flash ×N · Sanity PATCH ×N",
    tokenCost: "~500 tokens par article optimisé (Gemini Flash)",
    runTime: "~2–5 min selon nombre d'articles",
    output: "Métadonnées SEO mises à jour dans Sanity (sans modifier le contenu)",
  },
  "seo-checker": {
    model: "Aucun LLM — DataForSEO + Google Search Console",
    triggerDetail: "Cron `0 9 * * 1` — chaque lundi 9h UTC",
    steps: [
      { n: 1, label: "Articles publiés", detail: "Lit article-queue.json → filtre status=published avec targetKeyword défini" },
      { n: 2, label: "DataForSEO SERP", detail: "POST /serp/google/organic/live pour chaque targetKeyword → position actuelle de vanzonexplorer.com" },
      { n: 3, label: "Queue update", detail: "Met à jour seoPosition et lastSeoCheck dans article-queue.json pour chaque article vérifié" },
      { n: 4, label: "Rapport /admin/seo", detail: "Données visibles dans le dashboard SEO admin via lecture de la queue" },
    ],
    apiCalls: "DataForSEO /serp/organic/live × (nb articles publiés)",
    tokenCost: "0 token LLM",
    runTime: "~30–60s selon le nombre d'articles",
    output: "seoPosition mis à jour dans article-queue.json — visible dans /admin/seo",
  },
  "backlinks-daily-outreach": {
    model: "Groq llama-3.3-70b-versatile (email)",
    triggerDetail: "Cron `0 9 * * 1-5` — lun→ven 9h UTC",
    steps: [
      { n: 1, label: "Sélection prospect", detail: "Supabase → statut='découvert', score max, pas encore dans backlink_outreach → candidat #1" },
      { n: 2, label: "Email discovery", detail: "Hunter.io + Snov.io + Jina×12 pages + ZeroBounce validation → bestEmail" },
      { n: 3, label: "Groq génération", detail: "llama-3.3-70b → email personnalisé 5 phrases max, ton humain, référence contenu spécifique" },
      { n: 4, label: "Envoi Resend", detail: "From: jules@vanzonexplorer.com → to: bestEmail → subject + body HTML" },
      { n: 5, label: "Supabase update", detail: "backlink_outreach: sent_at, approved=true · backlink_prospects: statut='contacté'" },
      { n: 6, label: "Notification", detail: "Email récap admin → jules@vanzonexplorer.com + notification Telegram" },
    ],
    apiCalls: "Supabase ×3 · Hunter.io ×1 · Snov.io ×1 · Jina ×12 · ZeroBounce ×1 · Groq ×1 · Resend ×2",
    tokenCost: "~400 tokens (Groq llama-3.3-70b)",
    runTime: "~30–60s",
    output: "Email envoyé + prospect statut 'contacté' + récap admin",
  },
  "telegram-agent": {
    model: "Aucun LLM — Telegram Bot API",
    triggerDetail: "Déclenché automatiquement à la fin de chaque agent",
    steps: [
      { n: 1, label: "Réception message", detail: "Chaque agent appelle notifyTelegram(message) depuis scripts/lib/telegram.ts" },
      { n: 2, label: "Telegram Bot API", detail: "POST /sendMessage → chat_id = TELEGRAM_CHAT_ID, parse_mode=HTML" },
      { n: 3, label: "Confirmation", detail: "Non-bloquant — une erreur Telegram ne fait pas échouer l'agent appelant" },
    ],
    apiCalls: "Telegram Bot API ×1 par agent",
    tokenCost: "0 token LLM",
    runTime: "<1s",
    output: "Notification push sur ton Telegram",
  },
  "link-optimizer-monthly": {
    model: "Aucun LLM — 100% algorithmique",
    triggerDetail: "Cron `0 10 1 * *` — 1er du mois 10h UTC",
    steps: [
      { n: 1, label: "Index interne", detail: "Construit Map<keyword, /articles/slug> depuis tous les articles publiés. Keywords triés: targetKeyword + secondaryKeywords ≥ 5 chars, du plus long au plus court." },
      { n: 2, label: "Sélection articles", detail: "Articles publiés avec sanityId + lastLinkCheck > 30 jours (ou absent). Config via prompts/link-optimizer-monthly.json." },
      { n: 3, label: "Sanity fetch body", detail: "GET *[_id == $id][0]{_id, body} pour chaque article à traiter. Fetch minimal — pas le contenu complet." },
      { n: 4, label: "Audit liens externes", detail: "Extrait markDefs[_type='link'] → exclut vanzonexplorer.com + domaines ignorés. HEAD request × N avec retry ×2, timeout 8s. Concurrence max 5 simultanés." },
      { n: 5, label: "Suppression 404", detail: "HTTP 404/410/451 → retire le markDef + nettoie les marks[] des spans orphelins dans le Portable Text." },
      { n: 6, label: "Injection liens internes", detail: "Scanne blocs style='normal' (pas h2/h3, pas intro, spans non marqués). indexOf(keyword) + word boundary check → split span [avant | keyword lié | après]. Max 3 nouveaux liens / article, 1 cible max par article." },
      { n: 7, label: "Sanity patch", detail: "client.patch(_id).set({body}).commit() uniquement si body modifié (externes ou internes)." },
      { n: 8, label: "Queue update", detail: "lastLinkCheck = now() → article-queue.json → git commit [skip ci]" },
    ],
    apiCalls: "Sanity GET ×N · HEAD externes ×(total links) · Sanity PATCH ×(articles modifiés)",
    tokenCost: "0 token LLM",
    runTime: "~1–3 min selon le nombre de liens à vérifier",
    output: "Articles Sanity avec liens morts supprimés + maillage interne injecté",
  },
};

// ── Status / pipeline config ──────────────────────────────────────────────────

const STATUS_CONFIG = {
  active:   { label: "EN LIGNE",  dot: "bg-emerald-400 animate-pulse", text: "text-emerald-400" },
  inactive: { label: "OFFLINE",   dot: "bg-gray-500",                  text: "text-gray-500" },
  paused:   { label: "EN PAUSE",  dot: "bg-amber-400",                 text: "text-amber-400" },
};

const PIPELINE_ORDER = [
  "keyword-research-quarterly",
  "queue-builder-monthly",
  "blog-writer",
  "article-optimizer-quarterly",
  "link-optimizer-monthly",
];

type PanelTab = "info" | "tech" | "prompt";

// ── Sub-components ─────────────────────────────────────────────────────────────

function CharAvatar({ char, agent, size }: {
  char: typeof CHARACTERS[string];
  agent: Agent;
  size: "card" | "mini";
}) {
  const [failed, setFailed] = useState(false);
  const px = size === "card" ? 180 : 64;

  if (!char.img || failed) {
    return (
      <div
        className="flex items-center justify-center rounded-2xl"
        style={{
          width: size === "card" ? 100 : 56,
          height: size === "card" ? 100 : 56,
          background: `${char.glow}`,
          fontSize: size === "card" ? 52 : 28,
        }}
      >
        {agent.emoji}
      </div>
    );
  }

  return (
    <div
      className="relative"
      style={{ width: size === "card" ? 120 : 56, height: size === "card" ? 140 : 64 }}
    >
      <Image
        src={char.img}
        alt={char.name}
        width={px}
        height={px}
        loading="lazy"
        className="object-contain object-bottom w-full h-full drop-shadow-lg"
        onError={() => setFailed(true)}
        unoptimized
      />
    </div>
  );
}

function PromptEditor({ agentId, char }: {
  agentId: string;
  char: typeof CHARACTERS[string];
}) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/agents/${agentId}/prompt`);
      const data = await res.json() as { content: string };
      setContent(data.content ?? "");
    } catch {
      setError("Impossible de charger");
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (content === null) return;
    setSaving(true); setSaved(false); setError(null);
    try {
      const res = await fetch(`/api/admin/agents/${agentId}/prompt`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { setError("Échec sauvegarde"); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-10">
      <span className="text-xs text-gray-500 animate-pulse">Chargement du fichier…</span>
    </div>
  );

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400 leading-relaxed">
        Ce fichier est lu par l&apos;agent à chaque exécution. Sauvegarde = effectif au prochain run.
      </p>
      <textarea
        value={content ?? ""}
        onChange={(e) => { setContent(e.target.value); setSaved(false); }}
        rows={12}
        spellCheck={false}
        className="w-full rounded-xl text-xs font-mono leading-relaxed resize-y focus:outline-none px-4 py-3"
        style={{
          background: "rgba(0,0,0,0.55)",
          color: "#e2e8f0",
          border: `1px solid ${char.border}`,
          caretColor: char.color,
        }}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: saved ? "#30D158" : "transparent" }}>
          ✓ Sauvegardé
        </span>
        {error && <span className="text-xs text-red-400">{error}</span>}
        <button
          onClick={save}
          disabled={saving}
          className="px-4 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
          style={{
            background: `${char.color}22`,
            color: char.color,
            border: `1px solid ${char.border}`,
          }}
        >
          {saving ? "Sauvegarde…" : "Sauvegarder"}
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AgentsClient({ agents, queueStats }: AgentsClientProps) {
  const cronAgents = agents.filter((a) => a.trigger === "cron" || a.trigger === "webhook");
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<PanelTab>("tech");
  const activeCount = cronAgents.filter((a) => a.status === "active").length;

  const selAgent = selected ? cronAgents.find((a) => a.id === selected) : null;
  const selChar  = selected ? CHARACTERS[selected] : null;
  const selTech  = selected ? TECH[selected] : null;

  const pick = (id: string) => {
    if (selected === id) { setSelected(null); return; }
    setSelected(id);
    setTab("tech");
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .px { font-family: 'Press Start 2P', monospace; }
        .card-agent { cursor: pointer; transition: transform .18s ease, box-shadow .18s ease; }
        .card-agent:hover { transform: translateY(-4px); }
        .card-agent.sel { transform: translateY(-6px); }
        @keyframes pulse-soft {
          0%,100% { opacity:1; } 50% { opacity:.5; }
        }
        .char-float { animation: float-y 3s ease-in-out infinite; }
        @keyframes float-y {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .blink { animation: blink-k 1s step-end infinite; }
        @keyframes blink-k { 0%,100% { opacity:1; } 50% { opacity:0; } }
        .scanline {
          background: repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,.035) 2px,rgba(0,0,0,.035) 4px);
          pointer-events:none;
        }
        /* Bottom sheet on mobile */
        .panel-sheet {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
          max-height: 85vh; overflow-y: auto;
          border-radius: 20px 20px 0 0;
          animation: slide-up .22s ease;
        }
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @media (min-width: 768px) {
          .panel-sheet {
            position: static; max-height: none;
            border-radius: 20px;
            animation: none;
          }
        }
        .step-line { border-left: 2px solid; padding-left: 12px; }
      `}</style>

      <div
        className="min-h-screen relative"
        style={{ background: "linear-gradient(160deg,#08081a 0%,#0d0d20 60%,#08081a 100%)" }}
      >
        {/* Pixel grid */}
        <div className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.5) 1px,transparent 1px)",
            backgroundSize: "32px 32px",
          }} />
        <div className="scanline absolute inset-0" />

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

          {/* ── Header ── */}
          <div className="text-center mb-8 sm:mb-10">
            <p className="px text-[8px] sm:text-[9px] text-emerald-400 mb-3 tracking-widest">
              — VANZON EXPLORER —
            </p>
            <h1 className="px text-lg sm:text-2xl text-white mb-2 leading-relaxed"
              style={{ textShadow: "0 0 24px rgba(255,255,255,.25)" }}>
              AGENTS IA
            </h1>
            <p className="px text-[8px] text-gray-500">
              SELECT YOUR AGENT<span className="blink">_</span>
            </p>
          </div>

          {/* ── KPIs ── */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
            {[
              { label: "ACTIFS",   val: activeCount,          sub: `/ ${cronAgents.length}`, color: "#30D158" },
              { label: "PUBLIÉS",  val: queueStats.published, sub: "articles",               color: "#FFD60A" },
              { label: "EN QUEUE", val: queueStats.pending,   sub: "à rédiger",              color: "#BF5AF2" },
            ].map((k) => (
              <div key={k.label} className="rounded-2xl border px-3 sm:px-5 py-4 text-center"
                style={{ background:"rgba(255,255,255,.025)", borderColor:`${k.color}30`, boxShadow:`0 0 24px ${k.color}10` }}>
                <p className="px text-[7px] sm:text-[8px] mb-2" style={{ color: k.color }}>{k.label}</p>
                <p className="px text-2xl sm:text-3xl text-white leading-none">{k.val}</p>
                <p className="text-[10px] text-gray-500 mt-1">{k.sub}</p>
              </div>
            ))}
          </div>

          {/* ── Pipeline strip ── */}
          <div className="rounded-2xl border p-4 sm:p-5 mb-8 overflow-x-auto"
            style={{ background:"rgba(255,255,255,.02)", borderColor:"rgba(255,255,255,.07)" }}>
            <p className="px text-[7px] sm:text-[8px] text-gray-500 mb-3 tracking-widest">PIPELINE</p>
            <div className="flex items-center gap-1.5 min-w-max">
              {PIPELINE_ORDER.map((id, i) => {
                const c = CHARACTERS[id];
                if (!c) return null;
                const isSel = selected === id;
                return (
                  <div key={id} className="flex items-center gap-1.5">
                    <button onClick={() => pick(id)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all"
                      style={{
                        background: isSel ? `${c.bgGrad[0]}` : "rgba(255,255,255,.03)",
                        borderColor: isSel ? c.border : "rgba(255,255,255,.09)",
                        color: isSel ? c.color : "#666",
                        boxShadow: isSel ? `0 0 14px ${c.glow}` : "none",
                      }}>
                      <span className="w-2 h-2 rounded-full flex-none" style={{ background: c.color }} />
                      <span className="font-medium">{c.name}</span>
                    </button>
                    {i < PIPELINE_ORDER.length - 1 && (
                      <span className="px text-[8px] text-gray-700">→</span>
                    )}
                  </div>
                );
              })}
              <span className="px text-[8px] text-gray-700 ml-1">↩</span>
            </div>
          </div>

          {/* ── Cards grid — mobile: 1 col, sm: 2 col, md: 3 col ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {cronAgents.map((agent) => {
              const c = CHARACTERS[agent.id] ?? {
                name: agent.name, img: "", color: "#fff",
                bgGrad: ["#1a1a2e","#0d0d1a"] as [string,string],
                glow: "rgba(255,255,255,.2)", border: "rgba(255,255,255,.3)",
                role: agent.name, tagline: agent.description,
              };
              const st = STATUS_CONFIG[agent.status];
              const isSel = selected === agent.id;

              return (
                <div key={agent.id}
                  className={`card-agent rounded-2xl overflow-hidden ${isSel ? "sel" : ""}`}
                  style={{
                    background: `linear-gradient(160deg, ${c.bgGrad[0]} 0%, ${c.bgGrad[1]} 100%)`,
                    border: `1px solid ${isSel ? c.border : "rgba(255,255,255,.06)"}`,
                    boxShadow: isSel
                      ? `0 0 48px ${c.glow}, 0 16px 48px rgba(0,0,0,.5)`
                      : "0 4px 20px rgba(0,0,0,.35)",
                  }}
                  onClick={() => pick(agent.id)}
                >
                  {/* Card top: character + glow */}
                  <div className="relative flex items-end justify-between px-5 pt-5 pb-0"
                    style={{ minHeight: 130 }}>
                    {/* Glow circle */}
                    <div className="absolute bottom-0 left-8 w-24 h-24 rounded-full blur-3xl opacity-30"
                      style={{ background: c.color }} />

                    {/* Character avatar */}
                    <div className={`relative z-10 ${isSel ? "char-float" : ""}`}>
                      <CharAvatar char={c} agent={agent} size="card" />
                    </div>

                    {/* Status + cron badge */}
                    <div className="relative z-10 flex flex-col items-end gap-2 pb-3">
                      <span className={`flex items-center gap-1.5 text-[10px] font-semibold ${st.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                      <span className="px text-[7px] text-gray-600">
                        {agent.trigger === "cron" ? "AUTO" : "MANUAL"}
                      </span>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="px-5 py-4">
                    {/* Name + role */}
                    <p className="px text-[11px] mb-0.5" style={{ color: c.color }}>{c.name.toUpperCase()}</p>
                    <p className="text-sm font-bold text-white mb-1 leading-tight">{c.role}</p>
                    <p className="text-[11px] text-gray-400 mb-3 leading-relaxed">{c.tagline}</p>

                    {/* Divider */}
                    <div className="h-px mb-3" style={{ background:`linear-gradient(90deg,${c.color}33,transparent)` }} />

                    {/* Schedule */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px]">⏰</span>
                      <span className="text-[10px] text-gray-400 leading-snug">{agent.schedule}</span>
                    </div>

                    {/* API badges */}
                    <div className="flex flex-wrap gap-1 mb-1">
                      {agent.apis.map((api) => (
                        <span key={api}
                          className="text-[9px] px-1.5 py-0.5 rounded-md font-medium"
                          style={{ background:`${c.color}18`, color:c.color }}>
                          {api}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Detail panel — bottom sheet on mobile, inline on desktop ── */}
          {selAgent && selChar && (
            <>
              {/* Mobile overlay backdrop */}
              <div className="fixed inset-0 bg-black/50 z-40 md:hidden"
                onClick={() => setSelected(null)} />

              <div className={`panel-sheet md:mt-6 md:rounded-2xl md:border`}
                style={{
                  background: `linear-gradient(135deg, ${selChar.bgGrad[0]}f5, ${selChar.bgGrad[1]}f5)`,
                  borderColor: selChar.border,
                  boxShadow: `0 0 64px ${selChar.glow}`,
                }}>

                {/* Drag handle (mobile only) */}
                <div className="md:hidden flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                {/* Tabs */}
                <div className="flex items-center border-b"
                  style={{ borderColor:`${selChar.color}1a` }}>
                  {(["tech","info","prompt"] as PanelTab[]).map((t) => (
                    <button key={t}
                      onClick={() => setTab(t)}
                      className="px-4 sm:px-5 py-3 text-[10px] sm:text-[11px] font-semibold transition-all capitalize"
                      style={{
                        color: tab === t ? selChar.color : "#444",
                        borderBottom: tab === t ? `2px solid ${selChar.color}` : "2px solid transparent",
                      }}>
                      {t === "tech" ? "Technique" : t === "info" ? "Infos" : "Prompt"}
                    </button>
                  ))}
                  <div className="flex-1 flex justify-end pr-4">
                    <button onClick={() => setSelected(null)}
                      className="text-gray-600 hover:text-white text-xl transition-colors leading-none">
                      ×
                    </button>
                  </div>
                </div>

                <div className="p-4 sm:p-6">

                  {/* ── TAB: Technique ── */}
                  {tab === "tech" && selTech && (
                    <div>
                      {/* Header row */}
                      <div className="flex items-start gap-4 mb-5">
                        <div className="flex-none">
                          <CharAvatar char={selChar} agent={selAgent} size="mini" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="px text-[10px] sm:text-[11px] mb-1" style={{ color: selChar.color }}>
                            {selChar.name.toUpperCase()}
                          </p>
                          <p className="text-sm font-bold text-white">{selChar.role}</p>
                          <p className="text-[11px] text-gray-400 mt-1">{selTech.triggerDetail}</p>
                        </div>
                      </div>

                      {/* Cost pills */}
                      <div className="flex flex-wrap gap-2 mb-5">
                        {[
                          { label: "Modèle",  val: selTech.model },
                          { label: "Tokens",  val: selTech.tokenCost },
                          { label: "Durée",   val: selTech.runTime },
                          { label: "APIs",    val: selTech.apiCalls },
                        ].map(({ label, val }) => (
                          <div key={label}
                            className="rounded-xl px-3 py-2 flex-1 min-w-[140px]"
                            style={{ background:"rgba(255,255,255,.04)", border:`1px solid ${selChar.color}22` }}>
                            <p className="text-[9px] text-gray-500 mb-0.5 uppercase tracking-widest">{label}</p>
                            <p className="text-[11px] text-gray-200 font-medium leading-snug">{val}</p>
                          </div>
                        ))}
                      </div>

                      {/* Step-by-step */}
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-3 font-semibold">
                        Fonctionnement interne
                      </p>
                      <div className="space-y-0">
                        {selTech.steps.map((step, i) => (
                          <div key={step.n}
                            className="flex gap-3"
                            style={{ paddingBottom: i < selTech.steps.length - 1 ? 16 : 0 }}>
                            {/* Timeline */}
                            <div className="flex flex-col items-center flex-none w-6">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center flex-none text-[9px] font-bold"
                                style={{ background:`${selChar.color}25`, color:selChar.color }}>
                                {step.n}
                              </div>
                              {i < selTech.steps.length - 1 && (
                                <div className="flex-1 w-px mt-1" style={{ background:`${selChar.color}22` }} />
                              )}
                            </div>
                            <div className="flex-1 pb-0">
                              <p className="text-[11px] font-semibold text-white mb-0.5">{step.label}</p>
                              <p className="text-[11px] text-gray-400 leading-relaxed">{step.detail}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Output */}
                      <div className="mt-5 rounded-xl px-4 py-3"
                        style={{ background:"rgba(0,0,0,.35)", border:`1px solid ${selChar.color}22` }}>
                        <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1">Output</p>
                        <p className="text-[11px] text-gray-200">{selTech.output}</p>
                      </div>
                    </div>
                  )}

                  {/* ── TAB: Infos ── */}
                  {tab === "info" && (
                    <div>
                      <div className="flex items-start gap-4 mb-5">
                        <div className="flex-none">
                          <CharAvatar char={selChar} agent={selAgent} size="mini" />
                        </div>
                        <div className="flex-1">
                          <p className="px text-[10px] mb-1" style={{ color: selChar.color }}>
                            {selChar.name.toUpperCase()}
                          </p>
                          <p className="text-sm font-bold text-white mb-1">{selChar.role}</p>
                          <p className="text-[11px] text-gray-300 leading-relaxed italic">
                            &quot;{selChar.tagline}&quot;
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-xs">
                        {[
                          { k: "Schedule",  v: selAgent.schedule },
                          { k: "Cron",      v: selAgent.cronExpression ?? "—" },
                          { k: "APIs",      v: selAgent.apis.join(", ") },
                          { k: "Output",    v: selAgent.output },
                          { k: "Pipeline",  v: selAgent.pipeline },
                          { k: "Workflow",  v: selAgent.workflow ?? "Manuel" },
                          { k: "Fichier",   v: selAgent.file },
                        ].map(({ k, v }) => (
                          <div key={k} className="flex gap-2">
                            <span className="text-gray-500 flex-none w-20">{k} :</span>
                            <span className="text-gray-200 break-all leading-snug">{v}</span>
                          </div>
                        ))}
                      </div>

                      <code className="mt-4 block text-[10px] px-3 py-2.5 rounded-xl break-all"
                        style={{ background:"rgba(0,0,0,.4)", color:selChar.color }}>
                        $ {selAgent.manualCommand}
                      </code>
                    </div>
                  )}

                  {/* ── TAB: Prompt ── */}
                  {tab === "prompt" && (
                    <PromptEditor agentId={selAgent.id} char={selChar} />
                  )}
                </div>
              </div>
            </>
          )}

          {/* Footer */}
          <p className="px text-[7px] text-gray-700 text-center mt-10">
            © VANZON — AI SQUAD — scripts/agents/registry.json
          </p>
        </div>
      </div>
    </>
  );
}
