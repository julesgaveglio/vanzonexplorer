import CalendlyButton from "@/components/ui/CalendlyButton";

const reassurance = [
  "✓ Appel gratuit",
  "✓ Sans engagement",
  "✓ Réponse sous 24h",
];

export default function FormationCTA() {
  return (
    <section id="reserver" className="bg-white py-20 relative">
      <div
        className="absolute top-0 left-0 right-0 h-1"
        style={{ background: "linear-gradient(90deg, #E4D398, #B9945F)" }}
      />

      <div className="max-w-3xl mx-auto px-6 text-center">
        <span className="inline-flex items-center gap-2 badge-glass !px-5 !py-2 text-sm font-medium mb-8" style={{ background: 'rgba(205,167,123,0.12)', border: '1px solid rgba(205,167,123,0.35)', color: '#B9945F' }}>
          🎯 Prochaine session disponible
        </span>

        <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
          Prêt à construire
          <br />
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #CDA77B, #B9945F)' }}>
            ta liberté ?
          </span>
        </h2>

        <p className="text-lg text-slate-500 mt-4 max-w-xl mx-auto leading-relaxed">
          Réserve ton appel gratuit de 30 minutes avec Jules.
          On répond à toutes tes questions. Sans engagement.
        </p>

        <div className="mt-8">
          <CalendlyButton size="lg">
            📅 Réserver mon appel gratuit →
          </CalendlyButton>
        </div>

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
