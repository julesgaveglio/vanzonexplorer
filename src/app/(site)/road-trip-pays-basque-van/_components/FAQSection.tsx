// src/app/(site)/road-trip-pays-basque-van/_components/FAQSection.tsx
// FAQ expandable + JSON-LD schema.org FAQPage.

import type { FAQItem } from '@/types/road-trip-pb'

interface FAQSectionProps {
  items: FAQItem[]
}

export default function FAQSection({ items }: FAQSectionProps) {
  if (!items || items.length === 0) return null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <section className="mx-auto mt-16 max-w-4xl px-4">
      <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Questions fréquentes</h2>
      <div className="mt-6 space-y-3">
        {items.map((f, i) => (
          <details
            key={i}
            className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <summary className="cursor-pointer list-none font-semibold text-slate-900 marker:hidden">
              <span className="inline-block transition group-open:rotate-90">▸</span> {f.q}
            </summary>
            <p className="mt-3 text-sm text-slate-600">{f.a}</p>
          </details>
        ))}
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  )
}
