import LiquidButton from "@/components/ui/LiquidButton";
import CalendlyButton from "@/components/ui/CalendlyButton";
import FormationScrollReveal from "./FormationScrollReveal";

const pills = [
  { icon: "🙋‍♂️", label: "Accompagnement" },
  { icon: "🎬", label: "Formation vidéo" },
  { icon: "🤖", label: "Outils IA inclus" },
  { icon: "🛠️", label: "Pratique & terrain" },
  { icon: "📄", label: "Administratif & VASP" },
];

export default function FormationHero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #FFFFFF 0%, #FAF6F0 60%, #F5EDE5 100%)" }}
    >
      <div className="absolute top-20 -left-40 w-[500px] h-[500px] rounded-full opacity-[0.12] blur-3xl" style={{ background: '#CDA77B' }} />
      <div className="absolute top-60 right-0 w-96 h-96 rounded-full opacity-[0.10] blur-3xl" style={{ background: '#B9945F' }} />
      <div className="absolute bottom-0 left-1/2 w-80 h-80 rounded-full opacity-[0.08] blur-3xl" style={{ background: '#E4D398' }} />

      <div className="relative max-w-5xl mx-auto px-6 py-24 md:py-36 text-center">
        <span className="inline-flex items-center gap-2 badge-glass !px-5 !py-2 text-sm font-medium mb-8" style={{ background: 'rgba(205,167,123,0.12)', border: '1px solid rgba(205,167,123,0.35)', color: '#B9945F' }}>
          🎓 Van Business Academy
        </span>

        <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-[1.05] tracking-tight">
          De 0 à tes premiers revenus
          <br />
          <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #CDA77B, #B9945F)' }}>
            de location.
          </span>
        </h1>

        <p className="text-xl text-slate-500 mt-6 max-w-2xl mx-auto leading-relaxed">
          Jules et Elio t&apos;accompagnent de l&apos;achat du fourgon
          jusqu&apos;au premier euro généré — sans expérience requise.
        </p>

        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {pills.map((p) => (
            <span key={p.label} className="badge-glass !px-4 !py-2 text-sm text-slate-600 font-medium">
              {p.icon} {p.label}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-4 mt-10">
          <CalendlyButton size="lg">
            Réserver mon appel gratuit →
          </CalendlyButton>
          <LiquidButton variant="ghost" href="#programme" size="lg">
            Découvrir le programme ↓
          </LiquidButton>
        </div>

      </div>

      {/* Scroll reveal section — outside the centered text block so it can be full-width */}
      <FormationScrollReveal />
    </section>
  );
}
