// src/app/(site)/road-trip-pays-basque-van/_components/WizardCTA.tsx
// CTA vers le wizard /road-trip-personnalise avec pré-remplissage.

import Link from 'next/link'
import type { DurationSlug } from '@/types/road-trip-pb'
import type { GroupType, BudgetLevel } from '@/types/roadtrip'
import { wizardPrefillUrl } from '@/lib/road-trip-pb/constants'

interface WizardCTAProps {
  duration?: DurationSlug
  groupType?: GroupType
  budgetLevel?: BudgetLevel
  variant?: 'primary' | 'section'
}

export default function WizardCTA({
  duration,
  groupType,
  budgetLevel,
  variant = 'section',
}: WizardCTAProps) {
  const url = wizardPrefillUrl({ duration, groupType, budgetLevel })

  if (variant === 'primary') {
    return (
      <Link
        href={url}
        className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-700"
      >
        Génère ton road trip personnalisé →
      </Link>
    )
  }

  return (
    <section className="mx-auto my-16 max-w-4xl px-4">
      <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-white shadow-xl md:p-12">
        <h2 className="text-2xl font-bold md:text-3xl">Cet itinéraire te plaît ?</h2>
        <p className="mt-3 max-w-2xl text-blue-100">
          Génère ta version 100% personnalisée avec tes dates exactes, tes envies et ton budget.
          Tu reçois tout par email en 2 minutes, gratuitement.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={url}
            className="inline-flex items-center rounded-full bg-white px-6 py-3 font-semibold text-blue-700 shadow transition hover:-translate-y-0.5"
          >
            Génère mon road trip →
          </Link>
          <Link
            href="/location/cambo-les-bains"
            className="inline-flex items-center rounded-full border border-white/50 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
          >
            Louer un van Vanzon
          </Link>
        </div>
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-blue-100">
          <li>✓ Gratuit</li>
          <li>✓ Reçu par email</li>
          <li>✓ 2 minutes</li>
          <li>✓ Généré par IA + expert local</li>
        </ul>
      </div>
    </section>
  )
}
