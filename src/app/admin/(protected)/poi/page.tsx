'use client'

import { useState, useEffect, useCallback } from 'react'
import { POICard } from '@/components/admin/POICard'
import { POIEditModal } from '@/components/admin/POIEditModal'
import { BulkScrapePanel } from '@/components/admin/BulkScrapePanel'
import type { POICacheRow, POIListResponse, POICategory, POIBudgetLevel } from '@/types/poi'

type SortKey = 'recent' | 'rating' | 'alpha'

const CATEGORY_OPTIONS: { value: POICategory | 'all'; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'activite', label: 'Activité' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'spot_nuit', label: 'Spot nuit' },
  { value: 'culture', label: 'Culture' },
  { value: 'nature', label: 'Nature' },
  { value: 'parking', label: 'Parking' },
]

const BUDGET_OPTIONS: { value: POIBudgetLevel | 'all'; label: string }[] = [
  { value: 'all', label: 'Tous' },
  { value: 'gratuit', label: 'Gratuit' },
  { value: 'faible', label: '€' },
  { value: 'moyen', label: '€€' },
  { value: 'eleve', label: '€€€' },
]

export default function POIAdminPage() {
  // ─── Filtres ───
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<POICategory | 'all'>('all')
  const [budget, setBudget] = useState<POIBudgetLevel | 'all'>('all')
  const [city, setCity] = useState<string>('all')
  const [overnightOnly, setOvernightOnly] = useState(false)
  const [sort, setSort] = useState<SortKey>('recent')
  const [page, setPage] = useState(1)
  const pageSize = 50

  // ─── Data ───
  const [data, setData] = useState<POIListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ─── Ajout URL ───
  const [scrapeUrl, setScrapeUrl] = useState('')
  const [scrapeLoading, setScrapeLoading] = useState(false)
  const [scrapeMessage, setScrapeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  )

  // ─── Modal édition ───
  const [editingPoi, setEditingPoi] = useState<POICacheRow | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // ─── Fetch list ───
  const fetchList = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (category !== 'all') params.set('category', category)
      if (budget !== 'all') params.set('budget', budget)
      if (city !== 'all') params.set('city', city)
      if (overnightOnly) params.set('overnight_only', 'true')
      params.set('sort', sort)
      params.set('page', String(page))
      params.set('page_size', String(pageSize))

      const res = await fetch(`/api/admin/poi/list?${params.toString()}`)
      if (!res.ok) throw new Error('Erreur chargement')
      const json = (await res.json()) as POIListResponse
      setData(json)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [search, category, budget, city, overnightOnly, sort, page])

  // Debounced fetch on filter change
  useEffect(() => {
    const t = setTimeout(fetchList, 300)
    return () => clearTimeout(t)
  }, [fetchList])

  // ─── Actions ───
  const handleScrapeUrl = async () => {
    if (!scrapeUrl.trim()) return
    setScrapeLoading(true)
    setScrapeMessage(null)
    try {
      const res = await fetch('/api/admin/poi/scrape-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: scrapeUrl.trim() }),
      })
      const json = (await res.json()) as {
        success: boolean
        poi?: POICacheRow
        error?: string
        duplicate?: boolean
      }
      if (!res.ok || !json.success) {
        setScrapeMessage({ type: 'error', text: json.error ?? 'Erreur' })
      } else {
        setScrapeMessage({
          type: 'success',
          text: json.duplicate
            ? `✅ ${json.poi?.name} mis à jour (doublon fusionné)`
            : `✅ ${json.poi?.name} ajouté avec succès`,
        })
        setScrapeUrl('')
        fetchList()
      }
    } catch (err) {
      setScrapeMessage({ type: 'error', text: (err as Error).message })
    } finally {
      setScrapeLoading(false)
    }
  }

  const handleEdit = (poi: POICacheRow) => {
    setEditingPoi(poi)
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/poi/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur suppression')
      fetchList()
    } catch (err) {
      alert((err as Error).message)
    }
  }

  const handleSaved = (updated: POICacheRow) => {
    setData((prev) =>
      prev
        ? {
            ...prev,
            rows: prev.rows.map((r) => (r.id === updated.id ? updated : r)),
          }
        : prev
    )
  }

  const handleDeleted = (id: string) => {
    setData((prev) =>
      prev ? { ...prev, rows: prev.rows.filter((r) => r.id !== id), total: prev.total - 1 } : prev
    )
  }

  const exportUrl = (format: 'json' | 'csv') => {
    const params = new URLSearchParams({ format })
    if (search) params.set('search', search)
    if (category !== 'all') params.set('category', category)
    if (budget !== 'all') params.set('budget', budget)
    if (city !== 'all') params.set('city', city)
    if (overnightOnly) params.set('overnight_only', 'true')
    return `/api/admin/poi/export?${params.toString()}`
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <p className="text-slate-400 text-sm font-medium mb-1">Administration</p>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900">POI & Activités</h1>
        <p className="text-slate-500 mt-1">
          Base de données des lieux référencés pour le Road Trip Personnalisé
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        {/* ─── Panneau gauche ─── */}
        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pr-1">
          {/* Section 1 : Ajout URL */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-3">➕ Ajouter un lieu</h3>
            <input
              type="url"
              value={scrapeUrl}
              onChange={(e) => setScrapeUrl(e.target.value)}
              placeholder="https://restaurant-basque.fr"
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
              disabled={scrapeLoading}
            />
            <button
              type="button"
              onClick={handleScrapeUrl}
              disabled={scrapeLoading || !scrapeUrl.trim()}
              className="btn-primary w-full mt-2 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50"
            >
              {scrapeLoading ? '⏳ Analyse...' : 'Analyser & Importer'}
            </button>
            {scrapeMessage && (
              <p
                className={`mt-2 text-xs p-2 rounded-lg ${
                  scrapeMessage.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {scrapeMessage.text}
              </p>
            )}
          </div>

          {/* Section 2 : Bulk scraping */}
          <BulkScrapePanel onDone={fetchList} />

          {/* Section 3 : Stats */}
          {data && (
            <div className="glass-card rounded-2xl p-5">
              <h3 className="font-bold text-slate-900 text-sm mb-3">📊 Statistiques</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total POIs</span>
                  <span className="font-bold text-slate-900">{data.stats.total}</span>
                </div>
                <div className="h-px bg-slate-100 my-1" />
                {Object.entries(data.stats.by_category).map(([cat, count]) => (
                  <div key={cat} className="flex justify-between">
                    <span className="text-slate-500 capitalize">{cat.replace('_', ' ')}</span>
                    <span className="font-semibold text-slate-700">{count}</span>
                  </div>
                ))}
                <div className="h-px bg-slate-100 my-1" />
                <div className="flex justify-between">
                  <span className="text-slate-600">Avec image</span>
                  <span className="font-semibold text-green-700">{data.stats.with_image}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Sans image</span>
                  <span className="font-semibold text-amber-700">{data.stats.without_image}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Ajoutés ce mois</span>
                  <span className="font-semibold text-blue-700">{data.stats.added_this_month}</span>
                </div>
              </div>
            </div>
          )}

          {/* Section 4 : Export */}
          <div className="glass-card rounded-2xl p-5">
            <h3 className="font-bold text-slate-900 text-sm mb-3">📤 Export</h3>
            <div className="space-y-2">
              <a
                href={exportUrl('json')}
                className="block w-full text-center py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                Exporter JSON (filtres actifs)
              </a>
              <a
                href={exportUrl('csv')}
                className="block w-full text-center py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                Exporter CSV (filtres actifs)
              </a>
            </div>
          </div>
        </aside>

        {/* ─── Zone droite : grille ─── */}
        <main>
          {/* Filter bar sticky */}
          <div className="glass-card rounded-2xl p-4 mb-4 lg:sticky lg:top-4 lg:z-10">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="🔍 Rechercher nom, description, ville..."
                className="flex-1 min-w-[200px] bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />

              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value as POICategory | 'all')
                  setPage(1)
                }}
                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <select
                value={budget}
                onChange={(e) => {
                  setBudget(e.target.value as POIBudgetLevel | 'all')
                  setPage(1)
                }}
                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
              >
                {BUDGET_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <select
                value={city}
                onChange={(e) => {
                  setCity(e.target.value)
                  setPage(1)
                }}
                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
              >
                <option value="all">Toutes villes</option>
                {data?.cities?.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5">
                <input
                  type="checkbox"
                  checked={overnightOnly}
                  onChange={(e) => {
                    setOvernightOnly(e.target.checked)
                    setPage(1)
                  }}
                  className="rounded border-slate-300"
                />
                🌙 Nuit seulement
              </label>

              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
              >
                <option value="recent">Plus récents</option>
                <option value="rating">Mieux notés</option>
                <option value="alpha">A → Z</option>
              </select>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              {loading
                ? 'Chargement...'
                : `${data?.total ?? 0} lieu${(data?.total ?? 0) > 1 ? 'x' : ''} affiché${
                    (data?.total ?? 0) > 1 ? 's' : ''
                  }`}
            </p>
          </div>

          {/* Grille */}
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {loading && !data && (
            <div className="text-center py-20 text-slate-400">Chargement de la base...</div>
          )}

          {data && data.rows.length === 0 && !loading && (
            <div className="text-center py-20 glass-card rounded-2xl">
              <p className="text-slate-400">Aucun POI ne correspond aux filtres.</p>
            </div>
          )}

          {data && data.rows.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {data.rows.map((poi) => (
                <POICard key={poi.id} poi={poi} onEdit={handleEdit} onDelete={handleDelete} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {data && totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-xs text-slate-500">
                Page {page} / {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold disabled:opacity-40"
                >
                  ← Précédent
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold disabled:opacity-40"
                >
                  Suivant →
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal édition */}
      <POIEditModal
        poi={editingPoi}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
      />
    </div>
  )
}
