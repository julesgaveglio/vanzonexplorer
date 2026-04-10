'use client'

import { useState, useEffect } from 'react'
import type { POICacheRow, POICategory, POIBudgetLevel, OvernightType } from '@/types/poi'

const CATEGORIES: { value: POICategory; label: string }[] = [
  { value: 'activite', label: 'Activité' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'spot_nuit', label: 'Spot de nuit' },
  { value: 'culture', label: 'Culture' },
  { value: 'nature', label: 'Nature' },
  { value: 'parking', label: 'Parking' },
]

const BUDGETS: { value: POIBudgetLevel | ''; label: string }[] = [
  { value: '', label: '— Non défini —' },
  { value: 'gratuit', label: 'Gratuit' },
  { value: 'faible', label: 'Faible (€)' },
  { value: 'moyen', label: 'Moyen (€€)' },
  { value: 'eleve', label: 'Élevé (€€€)' },
]

const OVERNIGHT_TYPES: { value: OvernightType | ''; label: string }[] = [
  { value: '', label: '— Non défini —' },
  { value: 'parking_gratuit', label: 'Parking gratuit' },
  { value: 'aire_camping_car', label: 'Aire camping-car' },
  { value: 'camping_van', label: 'Camping van' },
  { value: 'spot_sauvage', label: 'Spot sauvage' },
]

const inputClass =
  'bg-white border border-slate-200 focus:ring-blue-200 focus:border-blue-400 rounded-xl px-3 py-2 w-full focus:outline-none focus:ring-2 transition-colors text-slate-900 text-sm'
const labelClass = 'text-xs font-semibold text-slate-700 mb-1 block uppercase tracking-wider'

export function POIEditModal({
  poi,
  open,
  onClose,
  onSaved,
  onDeleted,
}: {
  poi: POICacheRow | null
  open: boolean
  onClose: () => void
  onSaved: (poi: POICacheRow) => void
  onDeleted: (id: string) => void
}) {
  const [form, setForm] = useState<POICacheRow | null>(poi)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tagsInput, setTagsInput] = useState('')
  const [amenitiesInput, setAmenitiesInput] = useState('')

  useEffect(() => {
    if (poi) {
      setForm(poi)
      setTagsInput((poi.tags ?? []).join(', '))
      setAmenitiesInput((poi.overnight_amenities ?? []).join(', '))
      setError(null)
    }
  }, [poi])

  if (!open || !form) return null

  const update = <K extends keyof POICacheRow>(key: K, value: POICacheRow[K]) => {
    setForm((f) => (f ? { ...f, [key]: value } : f))
  }

  const handleSave = async () => {
    if (!form) return
    setSaving(true)
    setError(null)
    try {
      // Convert tags/amenities strings → arrays
      const tagsArr = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      const amenitiesArr = amenitiesInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      const payload = {
        ...form,
        tags: tagsArr,
        overnight_amenities: amenitiesArr,
        // Nettoyage des valeurs vides
        budget_level: form.budget_level || null,
        overnight_type: form.overnight_type || null,
      }

      const res = await fetch(`/api/admin/poi/${form.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = (await res.json()) as { success?: boolean; poi?: POICacheRow; error?: string }
      if (!res.ok || !json.success || !json.poi) {
        throw new Error(json.error ?? 'Erreur inconnue')
      }
      onSaved(json.poi)
      onClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!form) return
    if (!confirm(`Supprimer définitivement "${form.name}" ?`)) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/poi/${form.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(json.error ?? 'Erreur suppression')
      }
      onDeleted(form.id)
      onClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const isOvernight = form.category === 'spot_nuit' || form.overnight_allowed

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full my-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Modifier le POI</h2>
            <p className="text-xs text-slate-500 mt-0.5">{form.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Image preview */}
          {form.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.image_url}
              alt={form.name}
              className="w-full aspect-video object-cover rounded-xl border border-slate-200"
            />
          )}

          {/* Nom + catégorie */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Nom *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Catégorie *</label>
              <select
                value={form.category}
                onChange={(e) => update('category', e.target.value as POICategory)}
                className={inputClass}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sous-catégorie + Ville */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Sous-catégorie</label>
              <input
                type="text"
                value={form.subcategory ?? ''}
                onChange={(e) => update('subcategory', e.target.value || null)}
                placeholder="surf, rafting, musée..."
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Ville *</label>
              <input
                type="text"
                value={form.location_city}
                onChange={(e) => update('location_city', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Adresse */}
          <div>
            <label className={labelClass}>Adresse</label>
            <input
              type="text"
              value={form.address ?? ''}
              onChange={(e) => update('address', e.target.value || null)}
              className={inputClass}
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={form.description ?? ''}
              onChange={(e) => update('description', e.target.value || null)}
              rows={3}
              className={inputClass}
            />
          </div>

          {/* Tags */}
          <div>
            <label className={labelClass}>Tags (séparés par des virgules)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="sport, aventure, famille..."
              className={inputClass}
            />
          </div>

          {/* URLs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>URL externe</label>
              <input
                type="url"
                value={form.external_url ?? ''}
                onChange={(e) => update('external_url', e.target.value || null)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Google Maps URL</label>
              <input
                type="url"
                value={form.google_maps_url ?? ''}
                onChange={(e) => update('google_maps_url', e.target.value || null)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Image + rating */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Image URL</label>
              <input
                type="url"
                value={form.image_url ?? ''}
                onChange={(e) => update('image_url', e.target.value || null)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Note (0-5)</label>
              <input
                type="number"
                min={0}
                max={5}
                step={0.1}
                value={form.rating ?? ''}
                onChange={(e) =>
                  update('rating', e.target.value === '' ? null : Number(e.target.value))
                }
                className={inputClass}
              />
            </div>
          </div>

          {/* Budget + parking */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Budget</label>
              <select
                value={form.budget_level ?? ''}
                onChange={(e) =>
                  update('budget_level', (e.target.value || null) as POIBudgetLevel | null)
                }
                className={inputClass}
              >
                {BUDGETS.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Prix indicatif (texte)</label>
              <input
                type="text"
                value={form.price_indication ?? ''}
                onChange={(e) => update('price_indication', e.target.value || null)}
                placeholder="12-20€/pers"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.parking_nearby}
                onChange={(e) => update('parking_nearby', e.target.checked)}
                className="rounded border-slate-300"
              />
              Parking à proximité
            </label>
            {form.parking_nearby && (
              <input
                type="text"
                value={form.parking_info ?? ''}
                onChange={(e) => update('parking_info', e.target.value || null)}
                placeholder="ex : parking gratuit à 200m"
                className={`${inputClass} mt-2`}
              />
            )}
          </div>

          {/* Opening hours + duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Horaires</label>
              <input
                type="text"
                value={form.opening_hours ?? ''}
                onChange={(e) => update('opening_hours', e.target.value || null)}
                placeholder="Lun-Sam 9h-18h"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Durée estimée (min)</label>
              <input
                type="number"
                min={0}
                value={form.duration_minutes ?? ''}
                onChange={(e) =>
                  update(
                    'duration_minutes',
                    e.target.value === '' ? null : Number(e.target.value)
                  )
                }
                className={inputClass}
              />
            </div>
          </div>

          {/* ─── Section overnight (conditionnelle) ─── */}
          {isOvernight && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-4">
              <h3 className="font-semibold text-indigo-900 text-sm">🌙 Spot de nuit</h3>

              <label className="flex items-center gap-2 text-sm text-indigo-900">
                <input
                  type="checkbox"
                  checked={form.overnight_allowed}
                  onChange={(e) => update('overnight_allowed', e.target.checked)}
                  className="rounded border-indigo-300"
                />
                Nuit en van autorisée
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Type</label>
                  <select
                    value={form.overnight_type ?? ''}
                    onChange={(e) =>
                      update('overnight_type', (e.target.value || null) as OvernightType | null)
                    }
                    className={inputClass}
                  >
                    {OVERNIGHT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Prix/nuit (€)</label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={form.overnight_price_per_night ?? ''}
                    onChange={(e) =>
                      update(
                        'overnight_price_per_night',
                        e.target.value === '' ? null : Number(e.target.value)
                      )
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Capacité</label>
                <input
                  type="text"
                  value={form.overnight_capacity ?? ''}
                  onChange={(e) => update('overnight_capacity', e.target.value || null)}
                  placeholder="ex : 20 emplacements"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Commodités (séparées par des virgules)</label>
                <input
                  type="text"
                  value={amenitiesInput}
                  onChange={(e) => setAmenitiesInput(e.target.value)}
                  placeholder="eau potable, vidange, douche, wifi"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Restrictions</label>
                <input
                  type="text"
                  value={form.overnight_restrictions ?? ''}
                  onChange={(e) => update('overnight_restrictions', e.target.value || null)}
                  placeholder="ex : 72h max, interdit juillet-août"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Coordonnées GPS (lat,lng)</label>
                <input
                  type="text"
                  value={form.overnight_coordinates ?? ''}
                  onChange={(e) => update('overnight_coordinates', e.target.value || null)}
                  placeholder="43.3868,-1.6605"
                  className={inputClass}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-2xl sticky bottom-0">
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            Supprimer
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="btn-primary px-5 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : 'Sauvegarder'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
