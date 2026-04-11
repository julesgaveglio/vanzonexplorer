// src/app/(site)/road-trip-pays-basque-van/_components/POISection.tsx
// Grille de POI cards avec titre et accroche. Server component.

import POICard from './POICard'
import type { POIRowWithCoords } from '@/types/road-trip-pb'

interface POISectionProps {
  title: string
  subtitle?: string
  pois: POIRowWithCoords[]
  limit?: number
}

export default function POISection({ title, subtitle, pois, limit = 6 }: POISectionProps) {
  if (!pois.length) return null
  const visible = pois.slice(0, limit)
  return (
    <section className="mx-auto mt-12 max-w-6xl px-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-slate-600">{subtitle}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((poi) => (
          <POICard key={poi.id} poi={poi} />
        ))}
      </div>
    </section>
  )
}
