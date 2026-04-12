// src/app/(site)/road-trip-pays-basque-van/_components/FilterBar.tsx
// Barre de filtres : départ/arrivée, slider durée, styles d'aventure, toggle Espagne.

'use client'

import { useRouter } from 'next/navigation'
import { useState, useCallback, useRef, useEffect } from 'react'
import type { FilterState, AdventureStyle } from './filter-utils'
import { buildFilterUrl, SUGGESTED_CITIES } from './filter-utils'

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

  // Départ / arrivée : pas d'URL push (pas indexable), juste state local
  const setDeparture = (v: string) => onChange({ ...filters, departure: v })
  const setArrival = (v: string) => onChange({ ...filters, arrival: v })

  return (
    <div className="mx-auto max-w-6xl px-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Row 1 : Départ / Arrivée */}
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
          <CityInput
            label="Départ"
            emoji="📍"
            value={filters.departure}
            onChange={setDeparture}
            placeholder="Ville de départ…"
          />
          <CityInput
            label="Arrivée"
            emoji="🏁"
            value={filters.arrival}
            onChange={setArrival}
            placeholder="Ville d'arrivée…"
          />
        </div>

        {/* Séparateur */}
        <div className="my-5 border-t border-slate-100" />

        {/* Row 2 : Durée + Style + Espagne */}
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

// ─── CityInput : combobox avec suggestions prédéfinies + saisie libre ────────

function CityInput({
  label,
  emoji,
  value,
  onChange,
  placeholder,
}: {
  label: string
  emoji: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState(value)
  const ref = useRef<HTMLDivElement>(null)

  // Sync external value
  useEffect(() => { setQuery(value) }, [value])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = SUGGESTED_CITIES.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  )

  const select = (city: string) => {
    setQuery(city)
    onChange(city)
    setOpen(false)
  }

  const handleInputChange = (v: string) => {
    setQuery(v)
    onChange(v)
    setOpen(true)
  }

  return (
    <div className="relative min-w-0 flex-1" ref={ref}>
      <label className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {emoji} {label}
      </label>
      <input
        type="text"
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {filtered.slice(0, 8).map((city) => (
            <li key={city.name}>
              <button
                type="button"
                onClick={() => select(city.name)}
                className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700"
              >
                {city.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
