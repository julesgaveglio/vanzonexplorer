// src/app/(site)/road-trip-pays-basque-van/_components/RoadTripMap.tsx
// MapLibre + Maptiler outdoor-v2. Non partagé avec CatalogMap (contrats props différents).
// Client component, chargement dynamique dans les pages via `next/dynamic`.

'use client'

import { useEffect, useRef } from 'react'
import type maplibregl from 'maplibre-gl'
import type { POIRowWithCoords, RoadTripTemplateRow } from '@/types/road-trip-pb'
import { parseCoordinates } from '@/types/road-trip-pb'
import {
  PB_CENTER,
  PB_DEFAULT_ZOOM,
  PB_MAX_BOUNDS,
  CATEGORY_COLORS,
  CATEGORY_EMOJIS,
} from '@/lib/road-trip-pb/constants'

interface RoadTripMapProps {
  pois: POIRowWithCoords[]
  template?: RoadTripTemplateRow
  center?: [number, number]
  zoom?: number
  height?: { desktop: number; mobile: number }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export default function RoadTripMap({
  pois,
  template,
  center = PB_CENTER,
  zoom = PB_DEFAULT_ZOOM,
  height = { desktop: 500, mobile: 380 },
}: RoadTripMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY || ''

    import('maplibre-gl').then((ml) => {
      const map = new ml.Map({
        container: containerRef.current!,
        style: `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${MAPTILER_KEY}`,
        center,
        zoom,
        minZoom: 7,
        maxBounds: PB_MAX_BOUNDS,
        attributionControl: false,
      })
      map.addControl(new ml.NavigationControl({ showCompass: false }), 'top-right')
      map.addControl(new ml.AttributionControl({ compact: true }), 'bottom-right')
      mapRef.current = map

      map.on('load', () => {
        const poiById = new Map<string, POIRowWithCoords>()
        for (const poi of pois) {
          if (poi.id) poiById.set(poi.id, poi)
          const coords = parseCoordinates(poi.coordinates)
          if (!coords) continue
          const color = CATEGORY_COLORS[poi.category] ?? '#64748b'
          const emoji = CATEGORY_EMOJIS[poi.category] ?? '📍'

          const el = document.createElement('div')
          el.style.cssText = `
            width: 34px; height: 34px;
            background: ${color};
            border: 3px solid white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            font-size: 16px;
          `
          el.textContent = emoji

          const popupHtml = `
            <div style="font-family:system-ui,sans-serif;padding:4px 2px;max-width:240px">
              <p style="font-weight:700;font-size:13px;color:#0f172a;margin:0 0 4px 0">${escapeHtml(poi.name)}</p>
              <p style="color:#64748b;font-size:11px;margin:0 0 6px 0">${escapeHtml(poi.location_city)}</p>
              ${poi.description ? `<p style="color:#334155;font-size:12px;line-height:1.4;margin:0 0 6px 0">${escapeHtml(poi.description.slice(0, 140))}</p>` : ''}
              ${poi.external_url ? `<a href="${escapeHtml(poi.external_url)}" target="_blank" rel="noopener noreferrer" style="color:#2563eb;font-size:12px;font-weight:600;text-decoration:none">Voir le site →</a>` : ''}
            </div>
          `
          const popup = new ml.Popup({ offset: 20, maxWidth: '260px' }).setHTML(popupHtml)
          new ml.Marker({ element: el }).setLngLat(coords).setPopup(popup).addTo(map)
        }

        // Polyline si template fourni
        if (template && template.itinerary_json) {
          const rawDays = (template.itinerary_json as unknown as {
            days: Array<{
              stops: Array<{ poi_id: string }>
              overnight_id: string
            }>
          }).days
          const lineCoords: Array<[number, number]> = []
          for (const day of rawDays) {
            for (const stop of day.stops) {
              const poi = poiById.get(stop.poi_id)
              const c = parseCoordinates(poi?.coordinates)
              if (c) lineCoords.push(c)
            }
            const overnight = poiById.get(day.overnight_id)
            const oc = parseCoordinates(overnight?.coordinates)
            if (oc) lineCoords.push(oc)
          }
          if (lineCoords.length >= 2) {
            map.addSource('itinerary-line', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: { type: 'LineString', coordinates: lineCoords },
              },
            })
            map.addLayer({
              id: 'itinerary-line-layer',
              type: 'line',
              source: 'itinerary-line',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: {
                'line-color': '#2563eb',
                'line-width': 4,
                'line-dasharray': [2, 1],
              },
            })
          }
        }
      })
    })

    return () => {
      mapRef.current?.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full overflow-hidden rounded-2xl border border-slate-200 shadow-md"
      style={{
        height: `clamp(${height.mobile}px, 50vw, ${height.desktop}px)`,
      }}
    />
  )
}
