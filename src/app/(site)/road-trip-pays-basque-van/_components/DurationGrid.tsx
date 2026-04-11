// src/app/(site)/road-trip-pays-basque-van/_components/DurationGrid.tsx
// Grid des 4 cards duration sur le hub.

import Link from 'next/link'
import { ALL_DURATION_SLUGS } from '@/types/road-trip-pb'
import { DURATION_LABELS, durationPath } from '@/lib/road-trip-pb/constants'

const DURATION_DESCRIPTIONS: Record<string, string> = {
  '1-jour': 'Aperçu express Biarritz → Espelette',
  weekend: 'Côte basque et villages typiques',
  '5-jours': 'Océan, montagne, gastronomie',
  '1-semaine': 'Immersion totale côte + arrière-pays',
}

const DURATION_ICONS: Record<string, string> = {
  '1-jour': '☀️',
  weekend: '🏄',
  '5-jours': '🗺️',
  '1-semaine': '🏔️',
}

export default function DurationGrid() {
  return (
    <section className="mx-auto mt-12 max-w-6xl px-4">
      <h2 className="text-3xl font-bold text-slate-900">Choisissez votre durée</h2>
      <p className="mt-2 text-slate-600">
        Chaque durée propose des itinéraires adaptés au rythme et aux kilomètres.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ALL_DURATION_SLUGS.map((d) => (
          <Link
            key={d}
            href={durationPath(d)}
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-4xl">{DURATION_ICONS[d]}</div>
            <h3 className="mt-3 text-xl font-bold text-slate-900">{DURATION_LABELS[d]}</h3>
            <p className="mt-1 text-sm text-slate-600">{DURATION_DESCRIPTIONS[d]}</p>
            <span className="mt-4 inline-flex items-center text-sm font-semibold text-blue-600 group-hover:gap-2">
              Voir les itinéraires →
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
