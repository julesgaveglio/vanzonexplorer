"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";

interface Ad {
  id: string;
  name: string;
  hook_type: string | null;
  video_url: string | null;
  transcript: string | null;
  notes: string | null;
}

interface Campaign {
  id: string;
  name: string;
  start_date: string;
  end_date: string | null;
  budget_euros: number | null;
  platform: string | null;
  is_active: boolean;
}

const inputCls = "px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30";

export default function CampaignsClient() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [ads, setAds] = useState<Record<string, Ad[]>>({});
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", start_date: "", end_date: "", budget_euros: "", platform: "meta" });
  const [adForm, setAdForm] = useState({ name: "", hook_type: "emotional", video_url: "", transcript: "", notes: "" });
  const [showAdForm, setShowAdForm] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/funnel/campaigns").then((r) => r.json()).then((d) => setCampaigns(d.campaigns ?? []));
  }, []);

  async function loadAds(campaignId: string) {
    const res = await fetch(`/api/admin/funnel/ads?campaign_id=${campaignId}`);
    const d = await res.json();
    setAds((prev) => ({ ...prev, [campaignId]: d.ads ?? [] }));
  }

  function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      if (!ads[id]) loadAds(id);
    }
  }

  async function createCampaign(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/funnel/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        start_date: form.start_date,
        end_date: form.end_date || null,
        budget_euros: form.budget_euros ? parseInt(form.budget_euros) : null,
        platform: form.platform,
      }),
    });
    const d = await res.json();
    if (res.ok) {
      setCampaigns((prev) => [d.campaign, ...prev]);
      setShowNew(false);
      setForm({ name: "", start_date: "", end_date: "", budget_euros: "", platform: "meta" });
    }
  }

  async function createAd(campaignId: string) {
    const res = await fetch("/api/admin/funnel/ads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaign_id: campaignId, ...adForm }),
    });
    const d = await res.json();
    if (res.ok) {
      setAds((prev) => ({ ...prev, [campaignId]: [...(prev[campaignId] ?? []), d.ad] }));
      setShowAdForm(null);
      setAdForm({ name: "", hook_type: "emotional", video_url: "", transcript: "", notes: "" });
    }
  }

  async function deleteAd(adId: string, campaignId: string) {
    if (!confirm("Supprimer cette ad ?")) return;
    await fetch(`/api/admin/funnel/ads?id=${adId}`, { method: "DELETE" });
    setAds((prev) => ({ ...prev, [campaignId]: (prev[campaignId] ?? []).filter((a) => a.id !== adId) }));
  }

  const HOOK_LABELS: Record<string, string> = {
    emotional: "Émotionnel",
    data: "Chiffres",
    urgency: "Urgence",
    other: "Autre",
  };

  return (
    <div className="space-y-4">
      {/* New campaign */}
      {showNew ? (
        <form onSubmit={createCampaign} className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Nouvelle campagne</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nom (ex: Meta Avril)" required className={inputCls} />
            <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required className={inputCls} />
            <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} placeholder="Fin" className={inputCls} />
            <input type="number" value={form.budget_euros} onChange={(e) => setForm({ ...form, budget_euros: e.target.value })} placeholder="Budget €" className={inputCls} />
            <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} className={inputCls}>
              <option value="meta">Meta</option>
              <option value="google">Google</option>
              <option value="organic">Organique</option>
            </select>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-slate-900 hover:bg-slate-700">Créer</button>
            <button type="button" onClick={() => setShowNew(false)} className="px-3 py-2 text-sm text-slate-400">Annuler</button>
          </div>
        </form>
      ) : (
        <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-700">
          <Plus className="w-4 h-4" /> Nouvelle campagne
        </button>
      )}

      {/* Campaigns list */}
      {campaigns.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <p className="text-slate-500">Aucune campagne. Crée la première !</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              {/* Campaign header */}
              <button onClick={() => toggleExpand(c.id)} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 transition-colors">
                {expandedId === c.id ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{c.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {c.is_active ? "Active" : "Terminée"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {c.start_date} → {c.end_date || "en cours"}
                    {c.budget_euros && ` · ${c.budget_euros}€`}
                    {c.platform && ` · ${c.platform}`}
                  </p>
                </div>
                <span className="text-xs text-slate-400">{(ads[c.id] ?? []).length} ads</span>
              </button>

              {/* Expanded: ads list */}
              {expandedId === c.id && (
                <div className="border-t border-slate-100 px-5 py-4 space-y-3">
                  {(ads[c.id] ?? []).map((ad) => (
                    <div key={ad.id} className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-900 text-sm">{ad.name}</span>
                            {ad.hook_type && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                                {HOOK_LABELS[ad.hook_type] ?? ad.hook_type}
                              </span>
                            )}
                          </div>
                          {ad.video_url && (
                            <a href={ad.video_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-1 block truncate max-w-sm">
                              {ad.video_url}
                            </a>
                          )}
                        </div>
                        <button onClick={() => deleteAd(ad.id, c.id)} className="p-1 text-slate-400 hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {ad.transcript && (
                        <details className="mt-2">
                          <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">Transcript</summary>
                          <p className="text-xs text-slate-600 mt-2 whitespace-pre-line bg-white rounded-lg p-3 border border-slate-100 max-h-40 overflow-y-auto">
                            {ad.transcript}
                          </p>
                        </details>
                      )}
                      {ad.notes && <p className="text-xs text-slate-400 mt-2">{ad.notes}</p>}
                    </div>
                  ))}

                  {/* Add ad form */}
                  {showAdForm === c.id ? (
                    <div className="bg-blue-50/50 rounded-xl p-4 space-y-3">
                      <input type="text" value={adForm.name} onChange={(e) => setAdForm({ ...adForm, name: e.target.value })} placeholder="Nom de l'ad (ex: Hook émotionnel)" className={inputCls + " w-full"} />
                      <div className="grid grid-cols-2 gap-3">
                        <select value={adForm.hook_type} onChange={(e) => setAdForm({ ...adForm, hook_type: e.target.value })} className={inputCls}>
                          <option value="emotional">Émotionnel</option>
                          <option value="data">Chiffres réels</option>
                          <option value="urgency">Urgence</option>
                          <option value="other">Autre</option>
                        </select>
                        <input type="url" value={adForm.video_url} onChange={(e) => setAdForm({ ...adForm, video_url: e.target.value })} placeholder="URL vidéo" className={inputCls} />
                      </div>
                      <textarea value={adForm.transcript} onChange={(e) => setAdForm({ ...adForm, transcript: e.target.value })} placeholder="Transcript / script de l'ad..." rows={4} className={inputCls + " w-full resize-none"} />
                      <textarea value={adForm.notes} onChange={(e) => setAdForm({ ...adForm, notes: e.target.value })} placeholder="Notes (optionnel)" rows={2} className={inputCls + " w-full resize-none"} />
                      <div className="flex gap-2">
                        <button onClick={() => createAd(c.id)} disabled={!adForm.name.trim()} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-slate-900 hover:bg-slate-700 disabled:opacity-50">Ajouter</button>
                        <button onClick={() => setShowAdForm(null)} className="px-3 py-2 text-sm text-slate-400">Annuler</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowAdForm(c.id)} className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700">
                      <Plus className="w-3.5 h-3.5" /> Ajouter une ad
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
