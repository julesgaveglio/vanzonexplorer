'use client'

import { useState } from 'react'
import type { BulkScrapeCategoryKey, POIBulkScrapingEvent } from '@/types/poi'

interface CategoryOption {
  key: BulkScrapeCategoryKey
  label: string
}

const CATEGORIES: CategoryOption[] = [
  { key: 'sport', label: 'Sport & Aventure' },
  { key: 'nature', label: 'Nature & Randonnée' },
  { key: 'gastronomie_faible', label: 'Gastronomie (budget faible)' },
  { key: 'gastronomie_moyen', label: 'Gastronomie (budget moyen)' },
  { key: 'gastronomie_eleve', label: 'Gastronomie (budget élevé)' },
  { key: 'culture', label: 'Culture & Patrimoine' },
  { key: 'plages', label: 'Plages' },
  { key: 'spot_nuit_gratuit', label: 'Spots de nuit — Parking gratuit' },
  { key: 'spot_nuit_aire', label: 'Spots de nuit — Aires officielles' },
  { key: 'spot_nuit_camping', label: 'Spots de nuit — Campings van' },
]

interface LogLine {
  id: string
  text: string
  level: 'info' | 'success' | 'warn' | 'error'
}

export function BulkScrapePanel({ onDone }: { onDone: () => void }) {
  const [selected, setSelected] = useState<Set<BulkScrapeCategoryKey>>(new Set())
  const [running, setRunning] = useState(false)
  const [lines, setLines] = useState<LogLine[]>([])
  const [stats, setStats] = useState<{ added: number; duplicates: number; errors: number } | null>(
    null
  )

  const toggle = (key: BulkScrapeCategoryKey) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const pushLine = (text: string, level: LogLine['level'] = 'info') => {
    setLines((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text, level },
    ])
  }

  const handleStart = async () => {
    if (selected.size === 0) return
    setRunning(true)
    setLines([])
    setStats(null)

    try {
      const res = await fetch('/api/admin/poi/scrape-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: Array.from(selected) }),
      })

      if (!res.ok || !res.body) {
        const json = (await res.json().catch(() => ({}))) as { error?: string }
        pushLine(`❌ Erreur : ${json.error ?? res.statusText}`, 'error')
        setRunning(false)
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''
        for (const part of parts) {
          for (const raw of part.split('\n')) {
            if (!raw.startsWith('data: ')) continue
            try {
              const event = JSON.parse(raw.slice(6)) as POIBulkScrapingEvent
              handleEvent(event)
            } catch {
              /* ignore */
            }
          }
        }
      }
    } catch (err) {
      pushLine(`❌ Erreur réseau : ${(err as Error).message}`, 'error')
    } finally {
      setRunning(false)
      onDone()
    }
  }

  const handleEvent = (event: POIBulkScrapingEvent) => {
    switch (event.type) {
      case 'progress':
        pushLine(event.message, 'info')
        break
      case 'poi_added':
        pushLine(
          `✅ ${event.poi.name} — ${event.poi.category} — ${event.poi.location_city}`,
          'success'
        )
        break
      case 'duplicate':
        pushLine(`⚠️ Doublon ignoré : ${event.name}`, 'warn')
        break
      case 'error':
        pushLine(`❌ ${event.message}`, 'error')
        break
      case 'complete':
        setStats(event.stats)
        pushLine(
          `🎉 Terminé : ${event.stats.added} ajoutés · ${event.stats.duplicates} doublons · ${event.stats.errors} erreurs`,
          'success'
        )
        break
    }
  }

  return (
    <div className="glass-card rounded-2xl p-5">
      <h3 className="font-bold text-slate-900 text-sm mb-3">🔄 Scraping par catégorie</h3>

      {/* Checkboxes */}
      <div className="space-y-1.5 mb-4">
        {CATEGORIES.map((cat) => (
          <label
            key={cat.key}
            className={[
              'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors text-xs',
              selected.has(cat.key)
                ? 'bg-blue-50 text-blue-800 border border-blue-200'
                : 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700',
              running ? 'pointer-events-none opacity-60' : '',
            ].join(' ')}
          >
            <input
              type="checkbox"
              checked={selected.has(cat.key)}
              onChange={() => toggle(cat.key)}
              disabled={running}
              className="rounded border-slate-300"
            />
            <span className="font-medium">{cat.label}</span>
          </label>
        ))}
      </div>

      {/* Bouton */}
      <button
        type="button"
        onClick={handleStart}
        disabled={running || selected.size === 0}
        className="btn-primary w-full py-2.5 rounded-lg text-white text-sm font-semibold disabled:opacity-50"
      >
        {running
          ? '⏳ Scraping en cours...'
          : `Lancer le scraping (${selected.size} catégorie${selected.size > 1 ? 's' : ''})`}
      </button>

      {/* Stats */}
      {stats && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-green-50 border border-green-200 p-2">
            <p className="text-xs text-green-600 font-semibold">Ajoutés</p>
            <p className="text-lg font-black text-green-800">{stats.added}</p>
          </div>
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-2">
            <p className="text-xs text-yellow-600 font-semibold">Doublons</p>
            <p className="text-lg font-black text-yellow-800">{stats.duplicates}</p>
          </div>
          <div className="rounded-lg bg-red-50 border border-red-200 p-2">
            <p className="text-xs text-red-600 font-semibold">Erreurs</p>
            <p className="text-lg font-black text-red-800">{stats.errors}</p>
          </div>
        </div>
      )}

      {/* Log zone */}
      {lines.length > 0 && (
        <div className="mt-3 bg-slate-900 rounded-lg p-3 max-h-64 overflow-y-auto font-mono text-[10px] leading-relaxed">
          {lines.map((line) => (
            <p
              key={line.id}
              className={
                line.level === 'success'
                  ? 'text-green-400'
                  : line.level === 'warn'
                  ? 'text-yellow-400'
                  : line.level === 'error'
                  ? 'text-red-400'
                  : 'text-slate-300'
              }
            >
              {line.text}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
