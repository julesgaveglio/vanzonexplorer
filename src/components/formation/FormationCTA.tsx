import LiquidButton from "@/components/ui/LiquidButton";

const GHL_BOOKING_URL = process.env.NEXT_PUBLIC_GHL_BOOKING_URL || "#";

const reassurance = [
  "✓ Appel gratuit",
  "✓ Sans engagement",
  "✓ Réponse sous 24h",
];

export default function FormationCTA() {
  return (
    <section className="bg-white py-20 relative">
      {/* Bordure top dégradée */}
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{
          background: "linear-gradient(90deg, #3B82F6, #0EA5E9, #06B6D4)",
        }}
      />

      <div className="max-w-3xl mx-auto px-6 text-center">
        {/* Badge */}
        <span className="inline-flex items-center gap-2 badge-glass !bg-blue-50/80 !border-blue-200/50 !text-blue-700 !px-5 !py-2 text-sm font-medium mb-8">
          🎯 Prochaine session disponible
        </span>

        {/* Titre */}
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
          Prêt à construire
          <br />
          <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
            ta liberté ?
          </span>
        </h2>

        {/* Sous-titre */}
        <p className="text-lg text-slate-500 mt-4 max-w-xl mx-auto leading-relaxed">
          Réserve ton appel gratuit de 30 minutes avec Jules ou Elio.
          On répond à toutes tes questions. Sans engagement.
        </p>

        {/* CTA */}
        <div className="mt-8">
          <LiquidButton href={GHL_BOOKING_URL} external size="lg">
            📅 Réserver mon appel gratuit →
          </LiquidButton>
        </div>

        {/* Pills réassurance */}
        <div className="flex flex-wrap justify-center gap-4 mt-6">
          {reassurance.map((r) => (
            <span key={r} className="text-sm text-slate-500 font-medium">
              {r}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
