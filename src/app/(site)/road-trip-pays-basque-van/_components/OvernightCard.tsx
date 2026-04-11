// src/app/(site)/road-trip-pays-basque-van/_components/OvernightCard.tsx
// Card spot de nuit — affiche type, prix, amenities, restrictions.

import Image from 'next/image'
import type { POIRowWithCoords } from '@/types/road-trip-pb'

const TYPE_LABELS: Record<string, string> = {
  parking_gratuit: 'Parking gratuit',
  aire_camping_car: 'Aire camping-car',
  camping_van: 'Camping van',
  spot_sauvage: 'Spot sauvage',
}

interface OvernightCardProps {
  spot: POIRowWithCoords
}

export default function OvernightCard({ spot }: OvernightCardProps) {
  const typeLabel = spot.overnight_type
    ? TYPE_LABELS[spot.overnight_type] ?? spot.overnight_type
    : 'Spot nuit'
  const price =
    spot.overnight_price_per_night && spot.overnight_price_per_night > 0
      ? `${spot.overnight_price_per_night}€/nuit`
      : 'Gratuit'

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="relative h-36 w-full">
        {spot.image_url ? (
          <Image
            src={spot.image_url}
            alt={spot.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div
            className="flex h-full items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 text-4xl"
            aria-hidden="true"
          >
            🌙
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
          {typeLabel}
        </span>
        <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-slate-700">
          {price}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-bold text-slate-900">{spot.name}</h3>
        <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{spot.location_city}</p>
        {spot.description && (
          <p className="mt-2 line-clamp-3 text-sm text-slate-600">{spot.description}</p>
        )}
        {spot.overnight_amenities && spot.overnight_amenities.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1">
            {spot.overnight_amenities.slice(0, 4).map((a) => (
              <li key={a} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {a}
              </li>
            ))}
          </ul>
        )}
        {spot.overnight_restrictions && (
          <p className="mt-2 text-xs italic text-amber-700">⚠ {spot.overnight_restrictions}</p>
        )}
      </div>
    </article>
  )
}
