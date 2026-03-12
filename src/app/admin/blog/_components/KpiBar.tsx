import type { ReactNode } from "react";
import type { ArticleQueueItem } from "../types";

interface KpiBarProps {
  articles: ArticleQueueItem[];
  activeUsers?: number;
}

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
  placeholder?: boolean;
  icon: ReactNode;
}

function KpiCard({ label, value, sub, accent, placeholder, icon }: KpiCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${accent}15` }}>
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className={`text-2xl font-black ${placeholder ? "text-slate-300" : "text-slate-900"}`}>{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        {placeholder && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full mt-1 border border-slate-100">
            Non connecté
          </span>
        )}
      </div>
    </div>
  );
}

export default function KpiBar({ articles, activeUsers }: KpiBarProps) {
  const published = articles.filter((a) => a.status === "published").length;
  const pending = articles.filter((a) => a.status === "pending").length;
  const writing = articles.filter((a) => a.status === "writing").length;
  const needsWork = articles.filter((a) => a.status === "needs-improvement").length;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
      <KpiCard label="Publiés" value={published} sub={`sur ${articles.length} total`} accent="#22C55E"
        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
      />
      <KpiCard label="En attente" value={pending} sub={writing > 0 ? `+ ${writing} en rédaction` : "dans la queue"} accent="#6366F1"
        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
      />
      <KpiCard label="À améliorer" value={needsWork || "—"} sub="position > 15" accent="#F59E0B"
        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
      />
      <KpiCard label="Position SEO moy." value="--" placeholder accent="#3B82F6"
        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
      />
      <KpiCard
        label="Actifs maintenant"
        value={activeUsers != null ? activeUsers : "--"}
        sub="utilisateurs en temps réel"
        accent="#F9AB00"
        placeholder={activeUsers == null}
        icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
      />
    </div>
  );
}
