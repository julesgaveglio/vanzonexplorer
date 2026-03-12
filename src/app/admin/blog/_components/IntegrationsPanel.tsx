interface IntegrationCardProps {
  name: string;
  description: string;
  metrics: string[];
  logoUrl: string;
  accentColor: string;
  connected?: boolean;
  connectHref?: string;
}

function IntegrationCard({ name, description, metrics, logoUrl, accentColor, connected, connectHref }: IntegrationCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} alt={name} className="w-8 h-8 object-contain" />
          <div>
            <p className="text-sm font-bold text-slate-900">{name}</p>
            <p className="text-xs text-slate-400">{description}</p>
          </div>
        </div>
        {connected ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Connecté
          </span>
        ) : (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">Non connecté</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {metrics.map((metric) => (
          <div key={metric} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: accentColor }} />
            <span className="text-xs text-slate-500 font-medium">{metric}</span>
          </div>
        ))}
      </div>
      {connected ? (
        <div className="w-full py-2.5 rounded-xl text-sm font-semibold text-green-700 bg-green-50 text-center border border-green-100">
          ✓ Données actives
        </div>
      ) : connectHref ? (
        <a href={connectHref}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white text-center transition-all"
          style={{ background: accentColor }}>
          Connecter {name}
        </a>
      ) : (
        <button disabled className="w-full py-2.5 rounded-xl text-sm font-semibold text-slate-400 border border-slate-100 bg-slate-50 cursor-not-allowed">
          Prochainement
        </button>
      )}
    </div>
  );
}

interface IntegrationsPanelProps {
  gscConnected?: boolean;
  gaConnected?: boolean;
}

export default function IntegrationsPanel({ gscConnected = false, gaConnected = false }: IntegrationsPanelProps) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="w-8 h-px bg-slate-200" />
        <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Intégrations</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <IntegrationCard
          name="Google Search Console"
          description="Positions, clics et impressions Google"
          metrics={["Position moyenne", "Clics organiques", "Impressions", "CTR"]}
          logoUrl="https://www.gstatic.com/images/branding/product/2x/search_console_48dp.png"
          accentColor="#4285F4"
          connected={gscConnected}
          connectHref="/api/admin/gsc/auth"
        />
        <IntegrationCard
          name="Google Analytics 4"
          description="Trafic, sessions et comportement utilisateurs"
          metrics={["Sessions (28j)", "Pages vues", "Durée moyenne", "Taux de rebond"]}
          logoUrl="https://www.gstatic.com/analytics-suite/header/suite/v2/ic_analytics.svg"
          accentColor="#F9AB00"
          connected={gaConnected}
          connectHref="/api/admin/ga/auth"
        />
      </div>
    </div>
  );
}
