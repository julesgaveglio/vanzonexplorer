"use client";

import { useState } from "react";
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

const CHARACTERS: Record<string, {
  name: string;
  img: string;
  color: string;
  bgFrom: string;
  bgTo: string;
  glow: string;
  border: string;
  personality: string;
  role: string;
}> = {
  "blog-writer": {
    name: "Mario",
    img: "https://www.mariowiki.com/images/2/27/MK8_Deluxe_Art_-_Mario_%28transparent%29.png",
    color: "#E52521",
    bgFrom: "#3a0a08",
    bgTo: "#1a0504",
    glow: "rgba(229,37,33,0.5)",
    border: "rgba(229,37,33,0.6)",
    personality: "Le héros principal. Infatigable, toujours en action — il publie 3 articles par semaine sans jamais flancher.",
    role: "Agent Rédaction SEO",
  },
  "keyword-research-quarterly": {
    name: "Luigi",
    img: "https://www.mariowiki.com/images/7/7a/SMO-Luigi_Art.png",
    color: "#00A652",
    bgFrom: "#062a14",
    bgTo: "#031509",
    glow: "rgba(0,166,82,0.5)",
    border: "rgba(0,166,82,0.6)",
    personality: "L'explorateur. Il part en mission chaque trimestre découvrir des territoires inconnus — les mots-clés que personne n'a encore explorés.",
    role: "Agent Mots-Clés Trimestriel",
  },
  "queue-builder-monthly": {
    name: "Toad",
    img: "https://www.mariowiki.com/images/d/de/Toad_Artwork_-_Super_Mario_3D_World.png",
    color: "#2196F3",
    bgFrom: "#06192e",
    bgTo: "#030d18",
    glow: "rgba(33,150,243,0.5)",
    border: "rgba(33,150,243,0.6)",
    personality: "L'organisateur ultra-efficace. Chaque 1er du mois, il trie, priorise et alimente la queue d'articles avec précision.",
    role: "Agent Queue Builder",
  },
  "article-optimizer-quarterly": {
    name: "Yoshi",
    img: "https://www.mariowiki.com/images/3/3d/MKWorld_Yoshi.png",
    color: "#76C442",
    bgFrom: "#162808",
    bgTo: "#0b1504",
    glow: "rgba(118,196,66,0.5)",
    border: "rgba(118,196,66,0.6)",
    personality: "Le booster de performance. Il revient sur chaque article et le propulse plus haut dans les résultats Google.",
    role: "Agent Optimiseur Articles",
  },
  "keyword-researcher": {
    name: "Peach",
    img: "https://www.mariowiki.com/images/2/27/MKWorld_Peach.png",
    color: "#F48FB1",
    bgFrom: "#2d0a18",
    bgTo: "#18050d",
    glow: "rgba(244,143,177,0.5)",
    border: "rgba(244,143,177,0.6)",
    personality: "L'experte indépendante. Appelée ponctuellement pour une analyse ciblée, elle livre toujours des insights précieux.",
    role: "Agent Mots-Clés Manuel",
  },
  "seo-checker": {
    name: "Rosalina",
    img: "https://www.mariowiki.com/images/6/6c/Rosalina_Artwork_-_Super_Mario_3D_World.png",
    color: "#7C6FF7",
    bgFrom: "#160d35",
    bgTo: "#0b0720",
    glow: "rgba(124,111,247,0.5)",
    border: "rgba(124,111,247,0.6)",
    personality: "La gardienne cosmique. Depuis son observatoire, elle surveille chaque signal SEO du site chaque lundi matin.",
    role: "Agent Audit SEO",
  },
};

const STATUS_CONFIG = {
  active: { label: "EN LIGNE", color: "#00FF87", dot: "bg-[#00FF87] animate-pulse" },
  inactive: { label: "HORS LIGNE", color: "#666", dot: "bg-gray-500" },
  paused: { label: "EN PAUSE", color: "#FFB800", dot: "bg-amber-400" },
};

const PIPELINE_ORDER = [
  "keyword-research-quarterly",
  "queue-builder-monthly",
  "blog-writer",
  "article-optimizer-quarterly",
];

export default function AgentsClient({ agents, queueStats }: AgentsClientProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const activeCount = agents.filter((a) => a.status === "active").length;

  const selectedAgent = selected ? agents.find((a) => a.id === selected) : null;
  const selectedChar = selected ? CHARACTERS[selected] : null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

        .pixel-font { font-family: 'Press Start 2P', monospace; }

        .agent-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          cursor: pointer;
        }
        .agent-card:hover {
          transform: translateY(-6px) scale(1.02);
        }
        .agent-card.selected {
          transform: translateY(-8px) scale(1.03);
        }

        .char-img {
          transition: transform 0.3s ease, filter 0.3s ease;
        }
        .agent-card:hover .char-img,
        .agent-card.selected .char-img {
          transform: scale(1.08) translateY(-4px);
          filter: drop-shadow(0 12px 24px rgba(0,0,0,0.6));
        }

        .scanline {
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.03) 2px,
            rgba(0,0,0,0.03) 4px
          );
          pointer-events: none;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .float-anim { animation: float 3s ease-in-out infinite; }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .blink { animation: blink 1s step-end infinite; }

        @keyframes glitch {
          0% { text-shadow: 2px 0 #ff0000, -2px 0 #0000ff; }
          25% { text-shadow: -2px 0 #ff0000, 2px 0 #0000ff; }
          50% { text-shadow: 2px 2px #ff0000, -2px -2px #0000ff; }
          75% { text-shadow: -2px 2px #ff0000, 2px -2px #0000ff; }
          100% { text-shadow: 2px 0 #ff0000, -2px 0 #0000ff; }
        }
      `}</style>

      <div
        className="min-h-screen relative"
        style={{ background: "linear-gradient(160deg, #080815 0%, #0d0d1f 50%, #080815 100%)" }}
      >
        {/* Pixel grid background */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="scanline absolute inset-0" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-10">

          {/* Header */}
          <div className="text-center mb-12">
            <p className="pixel-font text-[10px] text-green-400 mb-3 tracking-widest">
              — VANZON EXPLORER —
            </p>
            <h1 className="pixel-font text-xl md:text-2xl text-white mb-2 leading-relaxed"
              style={{ textShadow: "0 0 20px rgba(255,255,255,0.3)" }}>
              AGENTS IA
            </h1>
            <p className="pixel-font text-[9px] text-gray-500 tracking-widest">
              SELECT YOUR AGENT<span className="blink">_</span>
            </p>
          </div>

          {/* KPI bar */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            {[
              { label: "ACTIFS", value: activeCount, sub: `/ ${agents.length} agents`, color: "#00FF87" },
              { label: "PUBLIÉS", value: queueStats.published, sub: "articles en ligne", color: "#FFB800" },
              { label: "EN QUEUE", value: queueStats.pending, sub: "articles à venir", color: "#7C6FF7" },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-xl border px-4 py-4 text-center"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderColor: `${kpi.color}33`,
                  boxShadow: `0 0 20px ${kpi.color}11`,
                }}
              >
                <p className="pixel-font text-[8px] mb-2" style={{ color: kpi.color }}>
                  {kpi.label}
                </p>
                <p className="pixel-font text-3xl text-white">{kpi.value}</p>
                <p className="text-[10px] text-gray-500 mt-1">{kpi.sub}</p>
              </div>
            ))}
          </div>

          {/* Pipeline */}
          <div
            className="rounded-2xl border p-5 mb-10"
            style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.08)" }}
          >
            <p className="pixel-font text-[8px] text-gray-500 mb-4 tracking-widest">PIPELINE AUTOMATISÉ</p>
            <div className="flex items-center justify-center gap-1 flex-wrap">
              {PIPELINE_ORDER.map((id, i) => {
                const char = CHARACTERS[id];
                if (!char) return null;
                return (
                  <div key={id} className="flex items-center gap-1">
                    <button
                      onClick={() => setSelected(selected === id ? null : id)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs"
                      style={{
                        background: selected === id ? `${char.bgFrom}` : "rgba(255,255,255,0.03)",
                        borderColor: selected === id ? char.border : "rgba(255,255,255,0.1)",
                        color: selected === id ? char.color : "#888",
                        boxShadow: selected === id ? `0 0 12px ${char.glow}` : "none",
                      }}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ background: char.color }} />
                      {char.name}
                    </button>
                    {i < PIPELINE_ORDER.length - 1 && (
                      <span className="pixel-font text-[8px] text-gray-600">→</span>
                    )}
                  </div>
                );
              })}
              <span className="pixel-font text-[8px] text-gray-600 ml-1">↩</span>
            </div>
          </div>

          {/* Cards grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {agents.map((agent) => {
              const char = CHARACTERS[agent.id] ?? {
                name: agent.name,
                img: "",
                color: "#ffffff",
                bgFrom: "#1a1a2e",
                bgTo: "#0d0d1a",
                glow: "rgba(255,255,255,0.2)",
                border: "rgba(255,255,255,0.3)",
                personality: agent.description,
                role: agent.name,
              };
              const status = STATUS_CONFIG[agent.status];
              const isSelected = selected === agent.id;

              return (
                <div
                  key={agent.id}
                  className={`agent-card rounded-2xl overflow-hidden flex flex-col ${isSelected ? "selected" : ""}`}
                  style={{
                    background: `linear-gradient(180deg, ${char.bgFrom} 0%, ${char.bgTo} 100%)`,
                    border: `1px solid ${isSelected ? char.border : "rgba(255,255,255,0.07)"}`,
                    boxShadow: isSelected
                      ? `0 0 40px ${char.glow}, 0 20px 60px rgba(0,0,0,0.5)`
                      : "0 4px 24px rgba(0,0,0,0.4)",
                  }}
                  onClick={() => setSelected(selected === agent.id ? null : agent.id)}
                >
                  {/* Image area */}
                  <div
                    className="relative flex items-end justify-center pt-6 pb-0 overflow-hidden"
                    style={{
                      background: `radial-gradient(ellipse 80% 60% at 50% 80%, ${char.glow} 0%, transparent 70%)`,
                      minHeight: "200px",
                    }}
                  >
                    {/* Glow circle behind character */}
                    <div
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full blur-3xl opacity-40"
                      style={{ background: char.color }}
                    />

                    {char.img ? (
                      <div className="char-img relative z-10 w-36 h-40 flex items-end justify-center float-anim" style={{ animationDelay: `${Math.random() * 2}s` }}>
                        <Image
                          src={char.img}
                          alt={char.name}
                          width={200}
                          height={220}
                          className="object-contain object-bottom w-full h-full"
                          unoptimized
                        />
                      </div>
                    ) : (
                      <div className="relative z-10 text-6xl pb-4">{agent.emoji}</div>
                    )}
                  </div>

                  {/* Card content */}
                  <div className="flex-1 p-4">
                    {/* Character name */}
                    <div className="flex items-center justify-between mb-1">
                      <p
                        className="pixel-font text-[11px] leading-relaxed"
                        style={{ color: char.color }}
                      >
                        {char.name.toUpperCase()}
                      </p>
                      {/* Status dot */}
                      <span className={`w-2 h-2 rounded-full ${status.dot}`} title={status.label} />
                    </div>

                    {/* Agent role */}
                    <p className="text-[11px] font-semibold text-white mb-3 leading-tight">
                      {char.role}
                    </p>

                    {/* Divider */}
                    <div className="w-full h-px mb-3" style={{ background: `linear-gradient(90deg, ${char.color}44, transparent)` }} />

                    {/* Schedule */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-[10px]">{agent.trigger === "cron" ? "⏰" : "🖐️"}</span>
                      <span className="text-[10px] text-gray-400">{agent.schedule}</span>
                    </div>

                    {/* APIs */}
                    <div className="flex flex-wrap gap-1">
                      {agent.apis.slice(0, 3).map((api) => (
                        <span
                          key={api}
                          className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                          style={{ background: `${char.color}18`, color: char.color }}
                        >
                          {api}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail panel — shown when card is selected */}
          {selectedAgent && selectedChar && (
            <div
              className="mt-6 rounded-2xl border p-6 transition-all"
              style={{
                background: `linear-gradient(135deg, ${selectedChar.bgFrom}ee, ${selectedChar.bgTo}ee)`,
                borderColor: selectedChar.border,
                boxShadow: `0 0 60px ${selectedChar.glow}`,
              }}
            >
              <div className="flex items-start gap-6">
                {/* Mini character */}
                <div className="flex-none w-20 h-24 relative">
                  <Image
                    src={selectedChar.img}
                    alt={selectedChar.name}
                    width={80}
                    height={96}
                    className="object-contain w-full h-full float-anim"
                    unoptimized
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <p className="pixel-font text-sm" style={{ color: selectedChar.color }}>
                      {selectedChar.name.toUpperCase()}
                    </p>
                    <span
                      className="pixel-font text-[8px] px-2 py-1 rounded"
                      style={{ background: `${selectedChar.color}22`, color: selectedChar.color }}
                    >
                      {STATUS_CONFIG[selectedAgent.status].label}
                    </span>
                  </div>

                  <p className="text-sm text-gray-300 mb-4 leading-relaxed italic">
                    &quot;{selectedChar.personality}&quot;
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-xs mb-4">
                    {[
                      { k: "Rôle", v: selectedChar.role },
                      { k: "Schedule", v: selectedAgent.schedule },
                      { k: "APIs", v: selectedAgent.apis.join(", ") },
                      { k: "Output", v: selectedAgent.output },
                      { k: "Pipeline", v: selectedAgent.pipeline },
                      { k: "Workflow", v: selectedAgent.workflow ?? "Manuel" },
                    ].map(({ k, v }) => (
                      <div key={k} className="flex gap-2">
                        <span className="text-gray-500 flex-none">{k} :</span>
                        <span className="text-gray-200">{v}</span>
                      </div>
                    ))}
                  </div>

                  <code
                    className="block text-[10px] px-3 py-2 rounded-lg"
                    style={{ background: "rgba(0,0,0,0.4)", color: selectedChar.color }}
                  >
                    $ {selectedAgent.manualCommand}
                  </code>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <p className="pixel-font text-[8px] text-gray-600 text-center mt-10">
            © VANZON EXPLORER — AI SQUAD — ADD AGENT → scripts/agents/registry.json
          </p>
        </div>
      </div>
    </>
  );
}
