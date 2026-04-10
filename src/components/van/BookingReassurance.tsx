interface PlatformReassuranceConfig {
  name: string
  bgColor: string // rgba avec alpha 0.10 pour le cercle icône
  insuranceUrl: string
}

// ─── Config par plateforme (garder la même structure visuelle, seuls
//     les tokens marque-dépendants varient : nom, couleur, URL assurance) ───
const PLATFORM_CONFIG: Record<string, PlatformReassuranceConfig> = {
  yescapa: {
    name: 'Yescapa',
    bgColor: 'rgba(232, 67, 108, 0.10)',
    insuranceUrl:
      'https://www.yescapa.fr/aide/assurance-et-assistance-24-7-locataire/comment-fonctionne-lassurance/',
  },
  wikicampers: {
    name: 'Wikicampers',
    bgColor: 'rgba(249, 115, 22, 0.10)',
    insuranceUrl: 'https://www.wikicampers.fr/location/assurances',
  },
}

export default function BookingReassurance({
  platform = 'Yescapa',
}: {
  platform?: string
}) {
  const key = platform.toLowerCase()
  const cfg =
    PLATFORM_CONFIG[key.includes('wikicampers') ? 'wikicampers' : 'yescapa']

  // Si la plateforme n'est ni yescapa ni wikicampers, on n'affiche rien.
  if (!key.includes('yescapa') && !key.includes('wikicampers')) {
    return null
  }

  return (
    <div className="glass-card p-5">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3"
        style={{ background: cfg.bgColor }}
      >
        🛡️
      </div>
      <h3 className="font-bold text-slate-900 text-sm mb-1">
        Pourquoi la réservation se fait sur {cfg.name} ?
      </h3>
      <p className="text-slate-500 text-sm leading-relaxed">
        {cfg.name} est la plateforme de location entre particuliers leader en France.
        En passant par eux, vous bénéficiez automatiquement d&apos;une{' '}
        <a
          href={cfg.insuranceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-slate-700 underline decoration-dotted underline-offset-2 hover:text-accent-blue transition-colors"
        >
          assurance tous risques
        </a>{' '}
        pour toute la durée de votre séjour — un vrai filet de sécurité pour vous
        comme pour nous. Le paiement et le contrat sont également sécurisés
        par leur plateforme.
      </p>
    </div>
  )
}
