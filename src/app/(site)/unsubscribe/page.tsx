// src/app/(site)/unsubscribe/page.tsx
import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Désabonnement',
  robots: { index: false, follow: false },
}

export default function UnsubscribePage({
  searchParams,
}: {
  searchParams: { success?: string; error?: string }
}) {
  const success = searchParams.success === '1'

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card max-w-md w-full p-8 text-center">
        {success ? (
          <>
            <div className="text-4xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-text-primary mb-3">
              Désabonnement confirmé
            </h1>
            <p className="text-text-secondary mb-6">
              Tu ne recevras plus d&apos;emails de road trip de notre part.
            </p>
          </>
        ) : (
          <>
            <div className="text-4xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-text-primary mb-3">
              Une erreur est survenue
            </h1>
            <p className="text-text-secondary mb-6">
              Le lien de désabonnement est invalide. Contacte-nous directement.
            </p>
          </>
        )}
        <Link href="/" className="btn-primary">
          Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  )
}
