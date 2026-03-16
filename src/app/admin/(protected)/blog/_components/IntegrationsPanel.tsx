interface IntegrationsPanelProps {
  gscConnected?: boolean;
  gaConnected?: boolean;
}

export default function IntegrationsPanel({ gscConnected = false, gaConnected = false }: IntegrationsPanelProps) {
  const bothConnected = gscConnected && gaConnected;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="w-8 h-px bg-slate-200" />
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Intégrations Google</span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {/* Google logo */}
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Google Search Console + Analytics 4</p>
              <p className="text-xs text-slate-400">Positions, clics, sessions et comportement utilisateurs</p>
            </div>
          </div>
          {bothConnected ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-100">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Connecté
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              {gscConnected || gaConnected ? "Partiellement connecté" : "Non connecté"}
            </span>
          )}
        </div>

        {/* Services status grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-50">
          {/* GSC */}
          <div className="px-6 py-4 flex items-center gap-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${gscConnected ? "bg-blue-50" : "bg-slate-50"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://www.gstatic.com/images/branding/product/2x/search_console_48dp.png" alt="GSC" className="w-5 h-5 object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800">Search Console</p>
              <p className="text-xs text-slate-400">Position, clics, impressions, CTR</p>
            </div>
            <span className={`flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${gscConnected ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${gscConnected ? "bg-blue-500" : "bg-slate-400"}`} />
              {gscConnected ? "Actif" : "Inactif"}
            </span>
          </div>

          {/* GA4 */}
          <div className="px-6 py-4 flex items-center gap-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${gaConnected ? "bg-amber-50" : "bg-slate-50"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://www.gstatic.com/analytics-suite/header/suite/v2/ic_analytics.svg" alt="GA4" className="w-5 h-5 object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800">Analytics 4</p>
              <p className="text-xs text-slate-400">Sessions, pages vues, durée, rebond</p>
            </div>
            <span className={`flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${gaConnected ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${gaConnected ? "bg-amber-400" : "bg-slate-400"}`} />
              {gaConnected ? "Actif" : "Inactif"}
            </span>
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 py-4 border-t border-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {bothConnected ? (
            <p className="text-xs text-slate-400">
              Données mises à jour toutes les heures (GSC) et 5 minutes (GA4).
              <a href="/api/admin/google/auth" className="text-blue-500 hover:text-blue-700 ml-1 font-medium">
                Renouveler le token →
              </a>
            </p>
          ) : (
            <div>
              <p className="text-xs text-slate-500 font-medium mb-0.5">
                {gscConnected && !gaConnected
                  ? "GA4 non connecté — le token actuel n'a pas le scope analytics."
                  : "Connecte les deux services en une seule autorisation Google."}
              </p>
              <p className="text-xs text-slate-400">
                Tu seras redirigé vers Google pour autoriser l&apos;accès, puis tu recevras un token à copier dans <code className="bg-slate-100 px-1 rounded">.env.local</code>.
              </p>
            </div>
          )}
          {!bothConnected && (
            <a
              href="/api/admin/google/auth"
              className="flex-shrink-0 inline-flex items-center gap-2 text-sm font-semibold text-white px-5 py-2.5 rounded-xl transition-all whitespace-nowrap"
              style={{ background: "linear-gradient(135deg, #4285F4 0%, #34A853 100%)", boxShadow: "0 4px 14px rgba(66,133,244,0.30)" }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Connecter GSC + GA4
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
