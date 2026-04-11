// src/app/(site)/road-trip-pays-basque-van/_components/POICard.tsx
// Card POI réutilisable — server component, pas d'état.

import Image from 'next/image'
import { CATEGORY_COLORS, CATEGORY_EMOJIS } from '@/lib/road-trip-pb/constants'
import type { POIRowWithCoords } from '@/types/road-trip-pb'

interface POICardProps {
  poi: POIRowWithCoords
}

const BUDGET_DOTS: Record<string, string> = {
  gratuit: '·',
  faible: '€',
  moyen: '€€',
  eleve: '€€€',
}

export default function POICard({ poi }: POICardProps) {
  const color = CATEGORY_COLORS[poi.category] ?? '#64748b'
  const emoji = CATEGORY_EMOJIS[poi.category] ?? '📍'
  const hasImage = Boolean(poi.image_url)
  const budgetLabel = poi.budget_level ? BUDGET_DOTS[poi.budget_level] : null

  const CardInner = (
    <>
      <div className="relative h-40 w-full overflow-hidden rounded-t-xl">
        {hasImage ? (
          <Image
            src={poi.image_url!}
            alt={poi.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div
            className="flex h-full items-center justify-center text-5xl"
            style={{
              background: `linear-gradient(135deg, ${color}22, ${color}55)`,
            }}
            aria-hidden="true"
          >
            {emoji}
          </div>
        )}
        <span
          className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold text-white shadow"
          style={{ backgroundColor: color }}
        >
          {poi.category}
        </span>
        {budgetLabel && (
          <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-slate-700 shadow">
            {budgetLabel}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 text-base font-bold text-slate-900">{poi.name}</h3>
        <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{poi.location_city}</p>
        {poi.description && (
          <p className="mt-2 line-clamp-3 text-sm text-slate-600">{poi.description}</p>
        )}
      </div>
    </>
  )

  const baseClasses =
    'group block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md'

  if (poi.external_url) {
    return (
      <a
        href={poi.external_url}
        target="_blank"
        rel="noopener noreferrer"
        data-budget={poi.budget_level ?? 'none'}
        className={baseClasses}
      >
        {CardInner}
      </a>
    )
  }
  return (
    <article data-budget={poi.budget_level ?? 'none'} className={baseClasses}>
      {CardInner}
    </article>
  )
}
