// src/app/(site)/road-trip-pays-basque-van/_components/ItineraryDisplay.tsx
// Timeline verticale jour par jour. Affiche le itinerary_json du template.

import type { RoadTripTemplateRow, POIRowWithCoords } from '@/types/road-trip-pb'

interface ItineraryDisplayProps {
  template: RoadTripTemplateRow
  pois: POIRowWithCoords[]
}

// Lookup POI par id
function makePOILookup(pois: POIRowWithCoords[]): Map<string, POIRowWithCoords> {
  const m = new Map<string, POIRowWithCoords>()
  for (const p of pois) if (p.id) m.set(p.id, p)
  return m
}

export default function ItineraryDisplay({ template, pois }: ItineraryDisplayProps) {
  const lookup = makePOILookup(pois)
  // Le seed script stocke: { days: [{day,theme,stops:[{poi_id,time,note}],overnight_id}] }
  const rawDays = (template.itinerary_json as unknown as {
    days: Array<{
      day: number
      theme: string
      stops: Array<{ poi_id: string; time: string; note: string }>
      overnight_id: string
    }>
  }).days

  if (!rawDays || rawDays.length === 0) return null

  return (
    <section className="mx-auto mt-12 max-w-5xl px-4">
      <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Itinéraire jour par jour</h2>
      {template.intro && <p className="mt-3 max-w-3xl text-slate-600">{template.intro}</p>}
      <ol className="mt-8 space-y-8">
        {rawDays.map((day) => {
          const overnight = lookup.get(day.overnight_id)
          return (
            <li
              key={day.day}
              className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-baseline justify-between">
                <h3 className="text-xl font-bold text-slate-900">Jour {day.day}</h3>
                <span className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                  {day.theme}
                </span>
              </div>
              <ul className="mt-4 space-y-4">
                {day.stops.map((stop, idx) => {
                  const poi = lookup.get(stop.poi_id)
                  if (!poi) return null
                  return (
                    <li key={idx} className="flex gap-3">
                      <div className="flex-none">
                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                          {stop.time}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900">{poi.name}</p>
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          {poi.location_city}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">{stop.note}</p>
                        {poi.external_url && (
                          <a
                            href={poi.external_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-block text-xs text-blue-600 hover:underline"
                          >
                            Voir le site →
                          </a>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
              {overnight && (
                <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                    🌙 Nuit
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">{overnight.name}</p>
                  <p className="text-sm text-slate-600">
                    {overnight.location_city}
                    {overnight.overnight_price_per_night
                      ? ` · ${overnight.overnight_price_per_night}€/nuit`
                      : ' · Gratuit'}
                  </p>
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
