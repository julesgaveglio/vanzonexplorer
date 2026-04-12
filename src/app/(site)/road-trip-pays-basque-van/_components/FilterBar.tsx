// src/app/(site)/road-trip-pays-basque-van/_components/FilterBar.tsx
// Barre de filtres : slider 1-14 jours, styles d'aventure, toggle Espagne.
// Met à jour l'URL via router.push sans reload.

'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import type { FilterState, AdventureStyle } from './filter-utils'
import { buildFilterUrl } from './filter-utils'

const STYLE_OPTIONS: { value: AdventureStyle; label: string; emoji: string }[] = [
  { value: 'nature', label: 'Nature & Randonnée', emoji: '🥾' },
  { value: 'sport', label: 'Sport & Loisirs', emoji: '🏄' },
  { value: 'culture', label: 'Culture & Local', emoji: '🎭' },
  { value: 'plages', label: 'Plages', emoji: '🏖️' },
]

interface FilterBarProps {
  filters: FilterState
  onChange: (f: FilterState) => void
}

export default function FilterBar({ filters, onChange }: FilterBarProps) {
  const router = useRouter()

  const pushUrl = useCallback(
    (next: FilterState) => {
      onChange(next)
      router.push(buildFilterUrl(next.days, next.styles, next.includeSpain), { scroll: false })
    },
    [router, onChange]
  )

  const setDays = (days: number) => pushUrl({ ...filters, days })

  const toggleStyle = (style: AdventureStyle) => {
    const next = filters.styles.includes(style)
      ? filters.styles.filter((s) => s !== style)
      : [...filters.styles, style]
    pushUrl({ ...filters, styles: next })
  }

  const toggleSpain = () => pushUrl({ ...filters, includeSpain: !filters.includeSpain })

  return (
    <div className="mx-auto max-w-6xl px-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
          {/* Durée */}
          <div className="min-w-0 flex-1">
            <label className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Votre durée
            </label>
            <div className="mt-3 flex items-center gap-4">
              <input
                type="range"
                min={1}
                max={14}
                value={filters.days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600"
              />
              <span className="flex-none rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-bold text-white tabular-nums">
                {filters.days}j
              </span>
            </div>
            <div className="mt-1 flex justify-between text-xs text-slate-400">
              <span>1 jour</span>
              <span>14 jours</span>
            </div>
          </div>

          {/* Style d'aventure */}
          <div className="min-w-0 flex-1">
            <label className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Votre style d&apos;aventure
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              {STYLE_OPTIONS.map((opt) => {
                const active = filters.styles.includes(opt.value)
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggleStyle(opt.value)}
                    className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                      active
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {opt.emoji} {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Espagne */}
          <div className="flex-none">
            <label className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Périmètre
            </label>
            <button
              type="button"
              onClick={toggleSpain}
              className={`mt-3 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                filters.includeSpain
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              🇪🇸 Inclure l&apos;Espagne
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
