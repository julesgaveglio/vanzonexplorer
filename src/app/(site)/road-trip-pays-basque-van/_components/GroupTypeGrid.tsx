// src/app/(site)/road-trip-pays-basque-van/_components/GroupTypeGrid.tsx
// Grid des 4 cards groupType sur une page duration.

import Link from 'next/link'
import type { DurationSlug } from '@/types/road-trip-pb'
import { ALL_GROUP_TYPES } from '@/types/road-trip-pb'
import {
  GROUP_LABELS_SHORT,
  GROUP_EMOJIS,
  finalPath,
  DURATION_LABELS,
} from '@/lib/road-trip-pb/constants'

interface GroupTypeGridProps {
  duration: DurationSlug
}

const GROUP_TAGLINES: Record<string, string> = {
  solo: 'Rythme libre, spots introspectifs',
  couple: 'Parenthèses romantiques, gastronomie',
  amis: 'Surf, fêtes, aventures partagées',
  famille: 'Plages, villages, sécurité',
}

export default function GroupTypeGrid({ duration }: GroupTypeGridProps) {
  return (
    <section className="mx-auto mt-12 max-w-6xl px-4">
      <h2 className="text-2xl font-bold text-slate-900">
        Road trip {DURATION_LABELS[duration]} — Choisissez votre profil
      </h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ALL_GROUP_TYPES.map((g) => (
          <Link
            key={g}
            href={finalPath(duration, g)}
            scroll={false}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="text-4xl">{GROUP_EMOJIS[g]}</div>
            <h3 className="mt-3 text-lg font-bold text-slate-900">{GROUP_LABELS_SHORT[g]}</h3>
            <p className="mt-1 text-sm text-slate-600">{GROUP_TAGLINES[g]}</p>
            <span className="mt-4 inline-flex text-sm font-semibold text-blue-600 group-hover:underline">
              Voir l&apos;itinéraire →
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
