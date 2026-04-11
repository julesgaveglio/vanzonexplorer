// src/app/(site)/road-trip-pays-basque-van/_components/OvernightSection.tsx

import OvernightCard from './OvernightCard'
import type { POIRowWithCoords } from '@/types/road-trip-pb'

interface OvernightSectionProps {
  title: string
  subtitle?: string
  spots: POIRowWithCoords[]
  limit?: number
}

export default function OvernightSection({
  title,
  subtitle,
  spots,
  limit = 6,
}: OvernightSectionProps) {
  if (!spots.length) return null
  const visible = spots.slice(0, limit)
  return (
    <section className="mx-auto mt-12 max-w-6xl px-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-slate-600">{subtitle}</p>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((spot) => (
          <OvernightCard key={spot.id} spot={spot} />
        ))}
      </div>
    </section>
  )
}
