"use client";

import { useEffect, useState } from "react";

interface Group {
  id: string;
  group_name: string;
  group_url: string;
  member_count: number | null;
  category: string;
  priority: number;
  is_active: boolean;
}

interface ScheduleSlot {
  id: string;
  scheduled_for: string;
  status: string;
  template_id: number;
  facebook_groups: { group_name: string; group_url: string } | null;
  facebook_templates: { label: string } | null;
}

interface Post {
  id: string;
  posted_at: string;
  status: string;
  template_id: number;
  facebook_groups: { group_name: string } | null;
  facebook_templates: { label: string } | null;
}

export default function FacebookOutreachPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGroup, setNewGroup] = useState({ group_name: "", group_url: "", priority: 3 });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    const [g, s, p] = await Promise.all([
      fetch("/api/admin/facebook-outreach/groups").then((r) => r.json()),
      fetch("/api/admin/facebook-outreach/schedule").then((r) => r.json()),
      fetch("/api/admin/facebook-outreach/posts").then((r) => r.json()),
    ]);
    setGroups(Array.isArray(g) ? g : []);
    setSchedule(Array.isArray(s) ? s : []);
    setPosts(Array.isArray(p) ? p : []);
    setLoading(false);
  }

  async function addGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newGroup.group_name || !newGroup.group_url) return;
    await fetch("/api/admin/facebook-outreach/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newGroup),
    });
    setNewGroup({ group_name: "", group_url: "", priority: 3 });
    await fetchAll();
    setMsg("Groupe ajouté ✓");
    setTimeout(() => setMsg(""), 3000);
  }

  async function toggleGroup(id: string, is_active: boolean) {
    await fetch("/api/admin/facebook-outreach/groups", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active: !is_active }),
    });
    await fetchAll();
  }

  async function deleteGroup(id: string) {
    if (!confirm("Supprimer ce groupe ?")) return;
    await fetch("/api/admin/facebook-outreach/groups", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await fetchAll();
  }

  const activeGroups = groups.filter((g) => g.is_active);
  const pendingSlots = schedule.filter((s) => s.status === "pending");
  const sentPosts = posts.filter((p) => p.status === "sent");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Facebook Outreach</h1>
          <p className="text-sm text-slate-500 mt-1">
            Bot Telegram · 1 post / 4 jours · Cooldown 28 jours par groupe
          </p>
        </div>
        <div className="bg-slate-100 text-slate-600 text-xs font-mono px-3 py-2 rounded-lg">
          npx tsx scripts/agents/generate-facebook-schedule.ts
        </div>
      </div>

      {msg && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm px-4 py-3 rounded-lg">
          {msg}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Groupes actifs", value: activeGroups.length },
          { label: "Posts planifiés", value: pendingSlots.length },
          { label: "Posts envoyés", value: sentPosts.length },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="text-3xl font-black text-slate-900">{k.value}</div>
            <div className="text-sm text-slate-500 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Ajouter groupe */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">Ajouter un groupe</h2>
        <form onSubmit={addGroup} className="flex gap-3 flex-wrap">
          <input
            className="flex-1 min-w-48 border border-slate-200 rounded-lg px-3 py-2 text-sm"
            placeholder="Nom du groupe"
            value={newGroup.group_name}
            onChange={(e) => setNewGroup({ ...newGroup, group_name: e.target.value })}
          />
          <input
            className="flex-1 min-w-64 border border-slate-200 rounded-lg px-3 py-2 text-sm"
            placeholder="URL du groupe (facebook.com/groups/...)"
            value={newGroup.group_url}
            onChange={(e) => setNewGroup({ ...newGroup, group_url: e.target.value })}
          />
          <select
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={newGroup.priority}
            onChange={(e) => setNewGroup({ ...newGroup, priority: parseInt(e.target.value) })}
          >
            {[1,2,3,4,5].map(n => <option key={n} value={n}>Priorité {n}</option>)}
          </select>
          <button type="submit" className="bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-lg">
            Ajouter
          </button>
        </form>
      </div>

      {/* Liste groupes */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Groupes ({groups.length})</h2>
        </div>
        {loading ? (
          <div className="p-6 text-sm text-slate-400">Chargement...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["Groupe", "Priorité", "Statut", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {groups.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <a href={g.group_url} target="_blank" rel="noopener noreferrer" className="font-medium text-slate-900 hover:text-blue-600">
                      {g.group_name}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-slate-500">⭐ {g.priority}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      g.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {g.is_active ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => toggleGroup(g.id, g.is_active)} className="text-xs text-blue-600 hover:underline">
                      {g.is_active ? "Désactiver" : "Activer"}
                    </button>
                    <button onClick={() => deleteGroup(g.id)} className="text-xs text-red-500 hover:underline">
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
              {!groups.length && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Aucun groupe — ajoutes-en un ci-dessus</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Planning */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Planning à venir</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {["Date", "Groupe", "Template", "Statut"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {schedule.slice(0, 15).map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{s.scheduled_for}</td>
                <td className="px-4 py-3 text-slate-900">{s.facebook_groups?.group_name ?? "—"}</td>
                <td className="px-4 py-3 text-slate-500">T{s.template_id} — {s.facebook_templates?.label}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    s.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                    s.status === "sent" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                  }`}>{s.status}</span>
                </td>
              </tr>
            ))}
            {!schedule.length && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Pas de planning — lance: npx tsx scripts/agents/generate-facebook-schedule.ts</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Historique */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Historique des posts</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {["Date", "Groupe", "Template", "Statut"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {posts.slice(0, 20).map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-mono text-xs text-slate-600">
                  {new Date(p.posted_at).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-4 py-3 text-slate-900">{p.facebook_groups?.group_name ?? "—"}</td>
                <td className="px-4 py-3 text-slate-500">T{p.template_id} — {p.facebook_templates?.label}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
            {!posts.length && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Aucun post envoyé</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
