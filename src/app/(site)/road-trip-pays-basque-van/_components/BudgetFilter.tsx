// src/app/(site)/road-trip-pays-basque-van/_components/BudgetFilter.tsx
// Filtre in-page par budget. Client component — applique un filtre visuel
// sur les enfants via CSS data attributes, sans re-fetch.

'use client'

import { useState } from 'react'
import type { BudgetLevel } from '@/types/roadtrip'
import { BUDGET_LABELS } from '@/lib/road-trip-pb/constants'

type FilterValue = BudgetLevel | 'all'

interface BudgetFilterProps {
  children: React.ReactNode
}

export default function BudgetFilter({ children }: BudgetFilterProps) {
  const [current, setCurrent] = useState<FilterValue>('all')

  const options: FilterValue[] = ['all', 'faible', 'moyen', 'eleve']

  return (
    <div data-budget-filter={current}>
      <div className="mx-auto mb-6 flex max-w-6xl flex-wrap gap-2 px-4">
        {options.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setCurrent(v)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              current === v
                ? 'bg-blue-600 text-white shadow'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {BUDGET_LABELS[v]}
          </button>
        ))}
      </div>
      <div
        className={
          current === 'all'
            ? ''
            : `[&_[data-budget]:not([data-budget="${current}"])]:hidden`
        }
      >
        {children}
      </div>
    </div>
  )
}
