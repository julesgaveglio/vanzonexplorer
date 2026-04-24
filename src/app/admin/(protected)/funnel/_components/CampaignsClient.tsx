"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ChevronDown, ChevronRight, Upload, Loader2 } from "lucide-react";

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
  const [uploadError, setUploadError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<{ fileName: string; campaignId: string }[]>([]);

  useEffect(() => {
    fetch("/api/admin/funnel/campaigns").then((r) => r.json()).then((d) => setCampaigns(d.campaigns ?? []));
  }, []);

  async function loadAds(campaignId: string) {
    const res = await fetch(`/api/admin/funnel/ads?campaign_id=${campaignId}`);
    const d = await res.json();
    setAds((prev) => ({ ...prev, [campaignId]: d.ads ?? [] }));
  }

  function toggleExpand(id: string) {
    if (expandedId === id) { setExpandedId(null); }
    else { setExpandedId(id); if (!ads[id]) loadAds(id); }
  }

  async function createCampaign(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/funnel/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name, start_date: form.start_date,
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

  async function handleMultiUpload(files: FileList, campaignId: string) {
    setUploadError("");
    for (const file of Array.from(files)) {
      setUploadQueue((prev) => [...prev, { fileName: file.name, campaignId }]);
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("campaign_id", campaignId);
        const res = await fetch("/api/admin/funnel/ads/transcribe", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Erreur");
        if (data.ad_id) {
          setAds((prev) => ({
            ...prev,
            [campaignId]: [...(prev[campaignId] ?? []), {
              id: data.ad_id, name: data.name, hook_type: null,
              video_url: data.video_url, transcript: data.transcript, notes: null,
            }],
          }));
        }
      } catch (err) {
        setUploadError(`${file.name}: ${err instanceof Error ? err.message : "Erreur"}`);
      } finally {
        setUploadQueue((prev) => prev.filter((q) => q.fileName !== file.name));
      }
    }
  }

  async function deleteAd(adId: string, campaignId: string) {
    if (!confirm("Supprimer cette ad ?")) return;
    await fetch(`/api/admin/funnel/ads?id=${adId}`, { method: "DELETE" });
    setAds((prev) => ({ ...prev, [campaignId]: (prev[campaignId] ?? []).filter((a) => a.id !== adId) }));
  }

  return (
    <div className="space-y-4">
      {showNew ? (
        <form onSubmit={createCampaign} className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Nouvelle campagne</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nom (ex: Meta Avril)" required className={inputCls} />
            <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required className={inputCls} />
            <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className={inputCls} />
            <input type="number" value={form.budget_euros} onChange={(e) => setForm({ ...form, budget_euros: e.target.value })} placeholder="Budget €" className={inputCls} />
            <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} className={inputCls}>
              <option value="meta">Meta</option><option value="google">Google</option><option value="organic">Organique</option>
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

      {campaigns.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <p className="text-slate-500">Aucune campagne.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
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
                    {c.start_date} → {c.end_date || "en cours"}{c.budget_euros ? ` · ${c.budget_euros}€` : ""}{c.platform ? ` · ${c.platform}` : ""}
                  </p>
                </div>
                <span className="text-xs text-slate-400">{(ads[c.id] ?? []).length} ads</span>
              </button>

              {expandedId === c.id && (
                <div className="border-t border-slate-100 px-5 py-4 space-y-3">
                  {(ads[c.id] ?? []).map((ad) => (
                    <div key={ad.id} className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-slate-900 text-sm">{ad.name}</span>
                          {ad.video_url && (
                            <a href={ad.video_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline mt-1 block truncate">Voir la vidéo</a>
                          )}
                        </div>
                        <button onClick={() => deleteAd(ad.id, c.id)} className="p-1 text-slate-400 hover:text-red-500 flex-shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {ad.transcript && (
                        <details className="mt-2">
                          <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">Transcript</summary>
                          <p className="text-xs text-slate-600 mt-2 whitespace-pre-line bg-white rounded-lg p-3 border border-slate-100 max-h-40 overflow-y-auto">{ad.transcript}</p>
                        </details>
                      )}
                    </div>
                  ))}

                  {uploadQueue.filter(q => q.campaignId === c.id).map((q) => (
                    <div key={q.fileName} className="bg-blue-50 rounded-xl p-4 flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 font-medium truncate">{q.fileName}</p>
                        <p className="text-xs text-slate-400">Upload + transcription...</p>
                      </div>
                    </div>
                  ))}

                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); handleMultiUpload(e.dataTransfer.files, c.id); }}
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${dragOver ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}
                  >
                    <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 mb-1">Glisse tes vidéos ici (1 ou plusieurs)</p>
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors">
                      ou clique pour sélectionner
                      <input type="file" accept="video/*,audio/*" multiple className="hidden" onChange={(e) => { if (e.target.files) handleMultiUpload(e.target.files, c.id); e.target.value = ""; }} />
                    </label>
                    <p className="text-xs text-slate-400 mt-2">MP4, MOV, WebM, MP3 — max 50MB</p>
                    <p className="text-xs text-slate-400">Tout est auto : upload + transcription + création</p>
                  </div>
                  {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
