import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = {
  title: "Paiement confirmé | Van Business Academy",
  robots: { index: false, follow: false },
};

export default function PaiementConfirmePage() {
  return (
    <div className="max-w-lg mx-auto px-4 pb-16 text-center">
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){var f=function(){if(typeof fbq==='function'){fbq('track','Purchase',{content_name:'vba',value:1497,currency:'EUR'});return}setTimeout(f,500)};f()})();`,
        }}
      />

      {/* Checkmark */}
      <div className="flex justify-center mb-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
            boxShadow: "0 8px 30px rgba(16,185,129,0.3)",
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
      </div>

      <h1
        className="font-display text-2xl sm:text-3xl font-black leading-tight mb-3"
        style={{ color: "#0F172A" }}
      >
        Bienvenue dans la Van Business Academy
      </h1>

      <p className="text-slate-500 text-base mb-8">
        Ton paiement a bien été reçu. Tu as maintenant accès à l&apos;intégralité
        de la formation.
      </p>

      <Link
        href="/dashboard/vba"
        className="inline-block font-bold text-white py-4 px-10 rounded-xl text-base sm:text-lg transition-all hover:scale-[1.02] hover:shadow-lg"
        style={{
          background: "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)",
          boxShadow: "0 4px 18px rgba(185, 148, 95, 0.45)",
        }}
      >
        Commencer la formation →
      </Link>

      <p className="text-xs text-slate-400 mt-4">
        Un email de confirmation a été envoyé par Stripe.
      </p>
    </div>
  );
}
