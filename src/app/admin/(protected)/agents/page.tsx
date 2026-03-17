import fs from "fs";
import path from "path";

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
}

function getAgents(): Agent[] {
  const registryPath = path.join(process.cwd(), "scripts/agents/registry.json");
  const raw = fs.readFileSync(registryPath, "utf-8");
  return JSON.parse(raw) as Agent[];
}

function getQueueStats() {
  const queuePath = path.join(process.cwd(), "scripts/data/article-queue.json");
  const raw = fs.readFileSync(queuePath, "utf-8");
  const queue = JSON.parse(raw) as { status: string }[];
  return {
    published: queue.filter((a) => a.status === "published").length,
    pending: queue.filter((a) => a.status === "pending").length,
    total: queue.length,
  };
}

const STATUS_COLORS = {
  active: { dot: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Actif" },
  inactive: { dot: "bg-slate-300", badge: "bg-slate-50 text-slate-500 border-slate-200", label: "Inactif" },
  paused: { dot: "bg-amber-400", badge: "bg-amber-50 text-amber-700 border-amber-200", label: "En pause" },
};

const TRIGGER_LABELS = {
  cron: { icon: "⏰", label: "Automatique" },
  manual: { icon: "🖐️", label: "Manuel" },
  webhook: { icon: "🔗", label: "Webhook" },
};

const TAG_COLORS: Record<string, string> = {
  SEO: "bg-blue-50 text-blue-600",
  Contenu: "bg-violet-50 text-violet-600",
  Analyse: "bg-cyan-50 text-cyan-600",
  Audit: "bg-orange-50 text-orange-600",
  Automatique: "bg-emerald-50 text-emerald-600",
  Manuel: "bg-slate-100 text-slate-500",
};

export default function AgentsPage() {
  const agents = getAgents();
  const queueStats = getQueueStats();
  const activeCount = agents.filter((a) => a.status === "active").length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-slate-900">Agents IA</h1>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {activeCount} en ligne
          </span>
        </div>
        <p className="text-sm text-slate-500">
          Vue d&apos;ensemble des agents IA qui travaillent sur Vanzon Explorer.
          Source de vérité : <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">scripts/agents/registry.json</code>
        </p>
      </div>

      {/* KPI bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Agents actifs</p>
          <p className="text-3xl font-black text-slate-900">{activeCount}</p>
          <p className="text-xs text-slate-400 mt-0.5">sur {agents.length} configurés</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Articles publiés</p>
          <p className="text-3xl font-black text-slate-900">{queueStats.published}</p>
          <p className="text-xs text-slate-400 mt-0.5">par l&apos;agent Rédaction</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">En queue</p>
          <p className="text-3xl font-black text-slate-900">{queueStats.pending}</p>
          <p className="text-xs text-slate-400 mt-0.5">articles à rédiger</p>
        </div>
      </div>

      {/* Agent cards */}
      <div className="space-y-4">
        {agents.map((agent) => {
          const status = STATUS_COLORS[agent.status];
          const trigger = TRIGGER_LABELS[agent.trigger];

          return (
            <div key={agent.id} className="bg-white rounded-2xl border border-slate-200 p-6 hover:border-slate-300 transition-colors">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="flex-none w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl">
                  {agent.emoji}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap mb-1">
                    <h2 className="text-base font-bold text-slate-900">{agent.name}</h2>
                    {/* Status badge */}
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold border ${status.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot} ${agent.status === "active" ? "animate-pulse" : ""}`} />
                      {status.label}
                    </span>
                    {/* Trigger badge */}
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-50 text-slate-500 border border-slate-200">
                      {trigger.icon} {trigger.label}
                    </span>
                  </div>

                  <p className="text-sm text-slate-500 mb-3 leading-relaxed">{agent.description}</p>

                  {/* Details grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium w-16 flex-none">Planning</span>
                      <span className="text-slate-700 font-medium">{agent.schedule}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium w-16 flex-none">Sortie</span>
                      <span className="text-slate-700">{agent.output}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium w-16 flex-none">APIs</span>
                      <span className="text-slate-700">{agent.apis.join(", ")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium w-16 flex-none">Fichier</span>
                      <code className="text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded text-[11px]">{agent.file}</code>
                    </div>
                  </div>

                  {/* Tags + command */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {agent.tags.map((tag) => (
                        <span key={tag} className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${TAG_COLORS[tag] ?? "bg-slate-100 text-slate-500"}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <code className="text-[11px] text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                      {agent.manualCommand}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="mt-6 text-xs text-slate-400 text-center">
        Pour ajouter un agent, modifie <code className="bg-slate-100 px-1.5 py-0.5 rounded">scripts/agents/registry.json</code> et redéploie.
      </p>
    </div>
  );
}
