import { Metadata } from 'next'
import Link from 'next/link'
import { PixelLeadEvent } from './PixelLeadEvent'

export const metadata: Metadata = {
  title: 'Road Trip envoyé ! — Vanzon Explorer',
  robots: { index: false, follow: false },
}

export default function RoadTripConfirmationPage() {
  return (
    <main className="min-h-screen bg-bg-primary flex items-center justify-center px-4">
      <PixelLeadEvent />
      <div className="max-w-lg w-full text-center py-16">
        {/* Success icon */}
        <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-green-500"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        </div>

        <h1 className="text-3xl font-black text-slate-900 mb-3">
          Votre road trip est en route !
        </h1>
        <p className="text-slate-500 text-lg mb-2">
          Consultez votre boite mail dans les prochaines minutes.
        </p>
        <p className="text-slate-400 text-sm mb-10">
          Pensez a verifier vos spams si vous ne le trouvez pas.
        </p>

        {/* What's next */}
        <div className="glass-card rounded-2xl p-8 mb-8 text-left">
          <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-5">
            En attendant votre itineraire
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="8" width="22" height="10" rx="3" />
                  <path d="M5 8V6a2 2 0 012-2h6l4 4" />
                  <circle cx="6.5" cy="18" r="2" />
                  <circle cx="17.5" cy="18" r="2" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Decouvrez nos vans</p>
                <p className="text-xs text-slate-500 mt-0.5">Yoni et Xalbat, prets a partir du Pays Basque.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Nos guides Pays Basque</p>
                <p className="text-xs text-slate-500 mt-0.5">Articles, spots et conseils pour votre aventure.</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/location"
            className="btn-primary px-6 py-3 rounded-xl text-white font-semibold inline-flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="8" width="22" height="10" rx="3" />
              <path d="M5 8V6a2 2 0 012-2h6l4 4" />
              <circle cx="6.5" cy="18" r="2" />
              <circle cx="17.5" cy="18" r="2" />
            </svg>
            Voir les vans disponibles
          </Link>
          <Link
            href="/articles"
            className="btn-ghost px-6 py-3 rounded-xl font-semibold"
          >
            Lire nos articles
          </Link>
        </div>
      </div>
    </main>
  )
}
