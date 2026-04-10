'use client'

import type { POICacheRow } from '@/types/poi'

// ─── Config catégories ──────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<
  POICacheRow['category'],
  { label: string; emoji: string; gradient: string; textColor: string }
> = {
  activite: {
    label: 'Activité',
    emoji: '🏄',
    gradient: 'from-emerald-400 to-teal-500',
    textColor: 'text-emerald-800',
  },
  restaurant: {
    label: 'Restaurant',
    emoji: '🍽️',
    gradient: 'from-orange-400 to-red-500',
    textColor: 'text-orange-800',
  },
  spot_nuit: {
    label: 'Spot nuit',
    emoji: '🌙',
    gradient: 'from-indigo-500 to-violet-600',
    textColor: 'text-indigo-800',
  },
  culture: {
    label: 'Culture',
    emoji: '🏛️',
    gradient: 'from-violet-500 to-purple-600',
    textColor: 'text-violet-800',
  },
  nature: {
    label: 'Nature',
    emoji: '🥾',
    gradient: 'from-green-500 to-emerald-600',
    textColor: 'text-green-800',
  },
  parking: {
    label: 'Parking',
    emoji: '🅿️',
    gradient: 'from-slate-400 to-slate-600',
    textColor: 'text-slate-800',
  },
}

const BUDGET_CONFIG: Record<
  NonNullable<POICacheRow['budget_level']>,
  { label: string; emoji: string; bgClass: string }
> = {
  gratuit: { label: 'Gratuit', emoji: '🆓', bgClass: 'bg-green-100 text-green-800' },
  faible: { label: '€', emoji: '💰', bgClass: 'bg-emerald-100 text-emerald-800' },
  moyen: { label: '€€', emoji: '💰', bgClass: 'bg-yellow-100 text-yellow-800' },
  eleve: { label: '€€€', emoji: '💰', bgClass: 'bg-rose-100 text-rose-800' },
}

const OVERNIGHT_TYPE_LABEL: Record<
  NonNullable<POICacheRow['overnight_type']>,
  string
> = {
  parking_gratuit: 'Parking gratuit',
  aire_camping_car: 'Aire camping-car',
  camping_van: 'Camping van',
  spot_sauvage: 'Spot sauvage',
}

// ─── Card component ─────────────────────────────────────────────────────────
export function POICard({
  poi,
  onEdit,
  onDelete,
}: {
  poi: POICacheRow
  onEdit: (poi: POICacheRow) => void
  onDelete: (id: string) => void
}) {
  const cat = CATEGORY_CONFIG[poi.category]
  const budget = poi.budget_level ? BUDGET_CONFIG[poi.budget_level] : null

  return (
    <div className="glass-card rounded-2xl overflow-hidden flex flex-col hover:shadow-lg transition-shadow">
      {/* ─── Image 16:9 ─── */}
      <div className="relative aspect-video overflow-hidden bg-slate-100">
        {poi.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poi.image_url}
            alt={poi.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              ;(e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${cat.gradient} flex items-center justify-center`}
          >
            <span className="text-6xl">{cat.emoji}</span>
          </div>
        )}
        {/* Badge catégorie top-left */}
        <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-xs font-semibold text-slate-800 shadow-sm">
          {cat.emoji} {cat.label}
        </div>
        {/* Badge budget top-right */}
        {budget && (
          <div
            className={`absolute top-2 right-2 px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${budget.bgClass}`}
          >
            {budget.label}
          </div>
        )}
      </div>

      {/* ─── Body ─── */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div>
          <h3 className="font-bold text-slate-900 text-base line-clamp-1">{poi.name}</h3>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
            <span>📍</span>
            <span className="truncate">
              {poi.location_city}
              {poi.address ? ` — ${poi.address}` : ''}
            </span>
          </p>
          {poi.rating !== null && poi.rating !== undefined && (
            <p className="text-xs text-amber-600 font-semibold mt-0.5">
              ⭐ {poi.rating.toFixed(1)}/5
            </p>
          )}
        </div>

        {poi.description && (
          <p className="text-xs text-slate-600 line-clamp-2 group-hover:line-clamp-none">
            {poi.description}
          </p>
        )}

        {/* ─── Tags ─── */}
        {poi.tags && poi.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {poi.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200"
              >
                {tag}
              </span>
            ))}
            {poi.tags.length > 4 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500">
                +{poi.tags.length - 4}
              </span>
            )}
          </div>
        )}

        {/* ─── Champs spécifiques catégorie ─── */}
        <CategorySpecificFields poi={poi} />

        {/* ─── Links ─── */}
        <div className="flex flex-wrap gap-2 mt-auto pt-2 border-t border-slate-100">
          {poi.external_url && (
            <a
              href={poi.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              🔗 Site
            </a>
          )}
          {poi.google_maps_url && (
            <a
              href={poi.google_maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-emerald-600 hover:underline"
            >
              🗺️ Maps
            </a>
          )}
        </div>

        {/* ─── Actions ─── */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => onEdit(poi)}
            className="flex-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            Modifier
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm(`Supprimer "${poi.name}" ?`)) onDelete(poi.id)
            }}
            className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-colors"
          >
            Supprimer
          </button>
        </div>

        {/* ─── Footer date ─── */}
        <p className="text-[10px] text-slate-400">
          Ajouté le {new Date(poi.scraped_at).toLocaleDateString('fr-FR')}
          {poi.source && poi.source !== 'manual' ? ` · ${poi.source}` : ''}
        </p>
      </div>
    </div>
  )
}

// ─── Champs spécifiques par catégorie ──────────────────────────────────────
function CategorySpecificFields({ poi }: { poi: POICacheRow }) {
  if (poi.category === 'spot_nuit') {
    return (
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2 space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-indigo-900">
            🌙{' '}
            {poi.overnight_type
              ? OVERNIGHT_TYPE_LABEL[poi.overnight_type]
              : 'Nuit van'}
          </span>
          <span className="font-bold text-indigo-900">
            {poi.overnight_price_per_night !== null && poi.overnight_price_per_night !== undefined
              ? `${poi.overnight_price_per_night}€/nuit`
              : 'Gratuit'}
          </span>
        </div>
        {poi.overnight_capacity && (
          <p className="text-[10px] text-indigo-700">{poi.overnight_capacity}</p>
        )}
        {poi.overnight_amenities && poi.overnight_amenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {poi.overnight_amenities.slice(0, 4).map((a) => (
              <span
                key={a}
                className="px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-white text-indigo-700 border border-indigo-200"
              >
                {a}
              </span>
            ))}
          </div>
        )}
        {poi.overnight_restrictions && (
          <p className="text-[10px] text-amber-700">
            ⚠️ {poi.overnight_restrictions}
          </p>
        )}
        {poi.overnight_coordinates && (
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(poi.overnight_coordinates ?? '')
            }}
            className="text-[10px] text-indigo-600 hover:underline"
            title="Copier les coordonnées"
          >
            📍 {poi.overnight_coordinates}
          </button>
        )}
      </div>
    )
  }

  if (poi.category === 'restaurant') {
    return (
      <div className="text-xs text-slate-600 space-y-0.5">
        {poi.price_indication && <p>💶 {poi.price_indication}</p>}
        {poi.subcategory && <p>🍽️ {poi.subcategory}</p>}
        {poi.opening_hours && <p>⏰ {poi.opening_hours}</p>}
      </div>
    )
  }

  if (poi.category === 'activite') {
    return (
      <div className="text-xs text-slate-600 space-y-0.5">
        {poi.duration_minutes && <p>⏱️ ~{poi.duration_minutes} min</p>}
        {poi.subcategory && <p>🎯 {poi.subcategory}</p>}
        {poi.parking_nearby && (
          <p>🅿️ {poi.parking_info ?? 'Parking à proximité'}</p>
        )}
      </div>
    )
  }

  if (poi.category === 'culture') {
    return (
      <div className="text-xs text-slate-600 space-y-0.5">
        {poi.price_indication && <p>🎫 {poi.price_indication}</p>}
        {poi.opening_hours && <p>⏰ {poi.opening_hours}</p>}
      </div>
    )
  }

  if (poi.category === 'nature') {
    return (
      <div className="text-xs text-slate-600 space-y-0.5">
        {poi.subcategory && <p>🌿 {poi.subcategory}</p>}
        {poi.parking_nearby && (
          <p>🅿️ {poi.parking_info ?? 'Parking à proximité'}</p>
        )}
      </div>
    )
  }

  return null
}
